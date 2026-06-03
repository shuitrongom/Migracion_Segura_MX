import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking, AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import BiometricLock from '@/components/BiometricLock';
import { registerForPushNotifications, resetBadgeCount, addNotificationResponseListener } from '@/lib/notifications';
import { storage } from '@/lib/storage';
import { apiFetch } from '@/lib/api';

export default function RootLayout() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // ─── Push Notifications ─────────────────────────────────────────────────────
    async function initPush() {
      await registerForPushNotifications();
    }
    initPush();

    // Resetear badge cuando la app se abre
    resetBadgeCount();

    // Listener para cuando el usuario toca una notificación (navegar a la pantalla correcta)
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.tipo === 'SOLICITUD_LISTA' || data?.tipo === 'PAGO_CONFIRMADO') {
        router.push('/(cliente)/mis-solicitudes' as any);
      } else if (data?.tipo === 'CITA_PROXIMA') {
        router.push('/(cliente)/mis-citas' as any);
      } else if (data?.tipo === 'DOCUMENTO_POR_VENCER') {
        router.push('/(cliente)/mis-documentos' as any);
      }
    });

    // Resetear badge cada vez que la app vuelve al foreground
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        resetBadgeCount();
      }
      appState.current = nextState;
    });

    // ─── Geolocalización al abrir la app ─────────────────────────────────────────
    async function captureLocation() {
      try {
        const token = await storage.getItem('access_token');
        if (!token) return; // Solo si está logueado

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        let ciudad = '';
        try {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geo) ciudad = `${geo.city || geo.district || ''}, ${geo.region || ''}`.trim().replace(/^,|,$/g, '');
        } catch {}

        // Enviar ubicación al backend
        await apiFetch('/clientes/ubicacion', {
          method: 'POST',
          body: JSON.stringify({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            ciudad,
            platform: Platform.OS,
          }),
        }).catch(() => {});
      } catch {}
    }
    captureLocation();

    // ─── Deep Links (Mercado Pago) ───────────────────────────────────────────────
    const handleDeepLink = (url: string) => {
      if (!url) return;
      const match = url.match(/migracion-segura:\/\/pago\/([^?]+)/);
      if (match) {
        const status = match[1];
        const tramiteIdMatch = url.match(/tramiteId=([^&]+)/);
        const tramiteId = tramiteIdMatch ? tramiteIdMatch[1] : '';
        router.replace(`/(cliente)/pago-resultado?status=${status}&tramiteId=${tramiteId}` as any);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <BiometricLock>
        <Stack screenOptions={{ headerShown: false }} />
      </BiometricLock>
    </SafeAreaProvider>
  );
}

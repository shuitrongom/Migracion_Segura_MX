import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking, AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import BiometricLock from '@/components/BiometricLock';
import { registerForPushNotifications, resetBadgeCount, addNotificationResponseListener } from '@/lib/notifications';
import { useTheme } from '@/lib/theme';

export default function RootLayout() {
  const responseListener = useRef<any>();
  const appState = useRef(AppState.currentState);
  const initTheme = useTheme(s => s.init);

  useEffect(() => {
    // Inicializar tema guardado
    initTheme();

    // Pedir permisos de notificación (solo permisos, no registra token en backend)
    Notifications.requestPermissionsAsync().catch(() => {});

    // Resetear badge cuando la app se abre
    resetBadgeCount();

    // Listener para cuando el usuario toca una notificación (navegar a la pantalla correcta)
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.tramiteId) {
        router.push({ pathname: '/(cliente)/estatus', params: { tramiteId: data.tramiteId as string } });
      } else if (data?.tipo === 'SOLICITUD_LISTA' || data?.tipo === 'PAGO_CONFIRMADO') {
        router.push('/(cliente)/estatus' as any);
      } else if (data?.tipo === 'CITA_PROXIMA') {
        router.push('/(cliente)/estatus' as any);
      } else if (data?.tipo === 'DOCUMENTO_POR_VENCER') {
        router.push('/(cliente)/documentos' as any);
      }
    });

    // Resetear badge cada vez que la app vuelve al foreground
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        resetBadgeCount();
      }
      appState.current = nextState;
    });

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

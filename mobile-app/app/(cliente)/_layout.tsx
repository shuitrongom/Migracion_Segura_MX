import { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { HomeIcon, StatusIcon, SearchIcon, BellIcon, UserIcon } from '@/components/TabIcons';
import { apiFetch } from '@/lib/api';
import { registerForPushNotifications, addNotificationReceivedListener } from '@/lib/notifications';

export default function ClienteLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;
  const notifListener = useRef<any>();

  useEffect(() => {
    // ─── Push Notifications (registrar token DESPUÉS del login) ──────────────────
    async function initPush() {
      const token = await registerForPushNotifications();
      if (token) {
        console.log('[PUSH] Token registrado:', token.slice(0, 30) + '...');
      } else {
        console.log('[PUSH] No se pudo obtener token');
      }
    }
    initPush();

    // Listener para notificaciones recibidas cuando la app está ABIERTA
    notifListener.current = addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      console.log('[PUSH] Notificación recibida en foreground:', title);
      // La notificación se muestra automáticamente gracias al NotificationHandler
      // pero además actualizamos el badge visual
    });

    // ─── Geolocalización ─────────────────────────────────────────────────────────
    async function captureLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[GEO] Permiso de ubicación denegado');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        let ciudad = '';
        try {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geo) ciudad = `${geo.city || geo.district || ''}, ${geo.region || ''}`.trim().replace(/^,|,$/g, '');
        } catch {}

        await apiFetch('/clientes/ubicacion', {
          method: 'POST',
          body: JSON.stringify({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            ciudad,
            platform: Platform.OS,
          }),
        });
        console.log('[GEO] Ubicación enviada:', ciudad);
      } catch (err) {
        console.log('[GEO] Error:', err);
      }
    }
    captureLocation();

    return () => {
      if (notifListener.current) notifListener.current.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 1,
          borderTopColor: '#1a1a1a',
          paddingTop: 8,
          paddingBottom: bottomPadding + 6,
          height: 62 + bottomPadding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="mis-tramites"
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="estatus"
        options={{
          tabBarLabel: 'Seguimiento',
          tabBarIcon: ({ color }) => <StatusIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          tabBarLabel: 'Avisos',
          tabBarIcon: ({ color }) => <BellIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="consulta"
        options={{
          tabBarLabel: 'Consultar',
          tabBarIcon: ({ color }) => <SearchIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <UserIcon color={color} size={22} />,
        }}
      />
      {/* Hidden screens - navigated to programmatically */}
      <Tabs.Screen name="solicitud-nueva" options={{ href: null }} />
      <Tabs.Screen name="tramite-nuevo" options={{ href: null }} />
      <Tabs.Screen name="beneficiarios" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="pago-resultado" options={{ href: null }} />
      <Tabs.Screen name="subir-documento" options={{ href: null }} />
    </Tabs>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { HomeIcon, StatusIcon, SearchIcon, BellIcon, UserIcon, PaymentIcon } from '@/components/TabIcons';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { registerForPushNotifications, addNotificationReceivedListener, addNotificationResponseListener } from '@/lib/notifications';

export default function ClienteLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;
  const notifListener = useRef<any>();
  const { colors, mode } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Cargar conteo de pendientes para badge en Seguimiento
    async function loadPendingCount() {
      try {
        const [tramitesRes, solicitudesRes] = await Promise.all([
          apiFetch('/tramites?page=1&limit=50'),
          apiFetch('/solicitudes/mis-solicitudes'),
        ]);
        let count = 0;
        if (tramitesRes.ok) {
          const data = await tramitesRes.json();
          const tramites = data.data || [];
          // Contar trámites con pagos pendientes o estatus que requiera atención
          count += tramites.filter((t: any) => t.estatus === 'en_revision' || t.estatus === 'recibido').length;
        }
        if (solicitudesRes.ok) {
          const solicitudes = await solicitudesRes.json();
          count += (Array.isArray(solicitudes) ? solicitudes : []).filter((s: any) => s.estatus === 'pendiente_pago').length;
        }
        setPendingCount(count);
      } catch {}
    }
    loadPendingCount();
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
    });

    // Listener para cuando el usuario TOCA una notificación → navegar al trámite
    const responseListener = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      console.log('[PUSH] Notificación tocada, data:', data);
      if (data?.tramiteId) {
        // Navegar a la pantalla de seguimiento con el trámite específico
        router.push({ pathname: '/(cliente)/estatus', params: { tramiteId: data.tramiteId } });
      } else if (data?.documentoId) {
        router.push('/(cliente)/documentos');
      } else if (data?.pagoId || data?.monto) {
        router.push('/(cliente)/pagos');
      }
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
      if (responseListener) responseListener.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: bottomPadding + 6,
          height: 62 + bottomPadding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: mode === 'dark' ? 0.5 : 0.1,
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
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', fontSize: 10, minWidth: 18, height: 18, lineHeight: 18 },
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
          tabBarLabel: 'Consulta',
          tabBarIcon: ({ color }) => <SearchIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          tabBarLabel: 'Pagos',
          tabBarIcon: ({ color }) => <PaymentIcon color={color} size={22} />,
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
      <Tabs.Screen name="pago-transferencia" options={{ href: null }} />
      <Tabs.Screen name="seleccionar-pago" options={{ href: null }} />
      <Tabs.Screen name="subir-documento" options={{ href: null }} />
    </Tabs>
  );
}

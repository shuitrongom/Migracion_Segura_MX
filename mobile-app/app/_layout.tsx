import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import BiometricLock from '@/components/BiometricLock';
import { registerForPushNotifications } from '@/lib/notifications';
import { storage } from '@/lib/storage';

export default function RootLayout() {
  useEffect(() => {
    // Registrar push notifications si el usuario está logueado
    async function initPush() {
      const token = await storage.getItem('access_token');
      if (token) {
        await registerForPushNotifications();
      }
    }
    initPush();

    // Manejar deep links de Mercado Pago (back_urls)
    const handleDeepLink = (url: string) => {
      if (!url) return;
      // migracion-segura://pago/exitoso?tramiteId=xxx
      // migracion-segura://pago/fallido?tramiteId=xxx
      // migracion-segura://pago/pendiente?tramiteId=xxx
      const match = url.match(/migracion-segura:\/\/pago\/([^?]+)/);
      if (match) {
        const status = match[1]; // exitoso, fallido, pendiente
        const tramiteIdMatch = url.match(/tramiteId=([^&]+)/);
        const tramiteId = tramiteIdMatch ? tramiteIdMatch[1] : '';
        router.replace(`/(cliente)/pago-resultado?status=${status}&tramiteId=${tramiteId}` as any);
      }
    };

    // Handler para cuando la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Handler para cuando la app se abre desde el link
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <BiometricLock>
        <Stack screenOptions={{ headerShown: false }} />
      </BiometricLock>
    </SafeAreaProvider>
  );
}

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  }, []);

  return (
    <SafeAreaProvider>
      <BiometricLock>
        <Stack screenOptions={{ headerShown: false }} />
      </BiometricLock>
    </SafeAreaProvider>
  );
}

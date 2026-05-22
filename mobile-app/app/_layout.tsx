import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BiometricLock from '@/components/BiometricLock';
import { storage } from '@/lib/storage';
import { isBiometricAvailable, setBiometricEnabled, isBiometricEnabled } from '@/lib/biometrics';

export default function RootLayout() {
  useEffect(() => {
    // Auto-habilitar biometría si el dispositivo la soporta y el usuario está logueado
    async function setupBiometrics() {
      const token = await storage.getItem('access_token');
      if (!token) return; // No logueado, no activar

      const available = await isBiometricAvailable();
      const alreadyEnabled = await isBiometricEnabled();

      // Si tiene biometría disponible y no se ha configurado, habilitarla por defecto
      if (available && !alreadyEnabled) {
        await setBiometricEnabled(true);
      }
    }
    setupBiometrics();
  }, []);

  return (
    <SafeAreaProvider>
      <BiometricLock>
        <Stack screenOptions={{ headerShown: false }} />
      </BiometricLock>
    </SafeAreaProvider>
  );
}

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BiometricLock from '@/components/BiometricLock';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <BiometricLock>
        <Stack screenOptions={{ headerShown: false }} />
      </BiometricLock>
    </SafeAreaProvider>
  );
}

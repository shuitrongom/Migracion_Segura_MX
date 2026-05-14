import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { OfflineBanner } from '../src/components/offline-banner';
import { useNetwork } from '../src/hooks/use-network';
import { syncQueue } from '../src/lib/sync-queue';
import { api } from '../src/lib/api';

function SyncOnReconnect() {
  const { isOffline } = useNetwork();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      // Connection restored — process pending queue
      syncQueue.processQueue(api);
    }
    wasOffline.current = isOffline;
  }, [isOffline]);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <OfflineBanner />
        <SyncOnReconnect />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tramites" options={{ headerShown: false }} />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import { useState, useEffect, useRef, useCallback } from 'react';

const HEALTH_CHECK_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/health`
  : 'https://api.migracionseguramx.com/api/v1/health';

const POLL_INTERVAL = 15000; // 15 seconds

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(HEALTH_CHECK_URL, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsConnected(true);
      setIsInternetReachable(true);
    } catch {
      setIsConnected(false);
      setIsInternetReachable(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Poll periodically
    intervalRef.current = setInterval(checkConnectivity, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnectivity]);

  return { isConnected, isInternetReachable, isOffline: !isConnected };
}

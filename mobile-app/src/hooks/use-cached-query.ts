import { useState, useEffect, useCallback } from 'react';
import { offlineCache } from '../lib/offline-cache';
import { useNetwork } from './use-network';

interface CachedQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isOffline: boolean;
  isCached: boolean;
  refetch: () => Promise<void>;
}

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
): CachedQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const { isOffline } = useNetwork();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    if (isOffline) {
      // Try to load from cache when offline
      const cached = await offlineCache.get<T>(key);
      if (cached) {
        setData(cached);
        setIsCached(true);
      }
      setIsLoading(false);
      return;
    }

    try {
      const result = await fetcher();
      setData(result);
      setIsCached(false);
      // Save to cache for offline use
      await offlineCache.set(key, result);
    } catch {
      // Try cache on network error
      const cached = await offlineCache.get<T>(key);
      if (cached) {
        setData(cached);
        setIsCached(true);
      } else {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, isOffline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, isError, isOffline, isCached, refetch: fetchData };
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'msm_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

export const offlineCache = {
  async set(key: string, data: unknown): Promise<void> {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  },

  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  },
};

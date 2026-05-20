import { Platform } from 'react-native';

// Simple storage using localStorage for web and a basic in-memory fallback for native
// (AsyncStorage can be added later for persistence on native)

const memoryStore: Record<string, string> = {};

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return memoryStore[key] ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      memoryStore[key] = value;
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      delete memoryStore[key];
    }
  },
};

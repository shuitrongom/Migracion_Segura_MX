/**
 * Storage enterprise — usa expo-secure-store en iOS/Android (Keychain/Keystore)
 * y localStorage en web. Los tokens JWT nunca van a memoria volátil en producción.
 */
import { Platform } from 'react-native';

let SecureStore: typeof import('expo-secure-store') | null = null;

// Importar SecureStore solo en nativo
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {}
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore?.getItemAsync(key) ?? null;
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore?.setItemAsync(key, value);
    } catch {}
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore?.deleteItemAsync(key);
    } catch {}
  },
};

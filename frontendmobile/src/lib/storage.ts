import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Two-tier persistence, replacing the web app's single `localStorage` bucket.
 *
 * - `secureStorage` — JWTs only. Backed by the iOS Keychain / Android Keystore.
 * - `cache`         — non-sensitive values that may be read on a cold start
 *                     before the network is available (the user object).
 *
 * SecureStore throws if the keychain is unavailable (locked device, some
 * emulator states), so every call is guarded: a read failure degrades to a
 * logged-out session rather than crashing the app on launch.
 */

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Nothing useful to do here — the session simply won't survive a restart.
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Already gone, or the keychain is unavailable. Either way it is clear.
    }
  },
};

export const cache = {
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      // Corrupt entry — drop it so it cannot fail again on the next launch.
      await AsyncStorage.removeItem(key).catch(() => undefined);
      return null;
    }
  },

  async setJson(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Best-effort cache write.
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Best-effort.
    }
  },
};

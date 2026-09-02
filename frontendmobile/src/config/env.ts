/**
 * Runtime configuration.
 *
 * Only `EXPO_PUBLIC_*` variables are readable from app code — they are inlined
 * into the bundle at build time, so nothing secret may live here. The web app's
 * `MOD_API_KEY` deliberately has no mobile counterpart; it stays server-side.
 */

const DEFAULT_API_URL = 'http://10.0.2.2:8000';

function readEnv(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/** Strips one trailing slash so `${API_URL}/movies` never doubles up. */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export const env = {
  apiUrl: normalizeUrl(readEnv(process.env.EXPO_PUBLIC_API_URL, DEFAULT_API_URL)),
  cloudinaryCloudName: readEnv(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, ''),
  cloudinaryUploadPreset: readEnv(process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET, ''),
  isDev: __DEV__,
} as const;

/** Storage keys. Token keys go to SecureStore, the rest to AsyncStorage. */
export const StorageKeys = {
  accessToken: 'plotmint_access_token',
  refreshToken: 'plotmint_refresh_token',
  user: 'plotmint_user',
} as const;

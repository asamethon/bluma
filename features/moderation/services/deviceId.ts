import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

/**
 * Cihaza sabit kimlik — ban (bkz. deviceBan.ts) bu kimliğe dayanır.
 *
 * Uygulama silinip yeniden kurulduğunda kimliğin AYNI kalması gerekir, yoksa
 * ban tek "sil-kur" ile aşılır. İki dayanak birlikte kullanılır:
 *  - iOS: Keychain kaydı uygulama silinse bile cihazda kalır (SecureStore).
 *    identifierForVendor ise yalnızca ilk üretimde tohum olarak kullanılır;
 *    tek başına güvenilmez, aynı satıcının tüm uygulamaları silinince sıfırlanır.
 *  - Android: Keystore/SharedPreferences kurulumla birlikte silinir, ama
 *    ANDROID_ID imza anahtarı başına sabittir — yeniden kurulumda aynı
 *    kimliği ÜRETİR.
 *
 * Reklam kimliği (IDFA/GAID) bilinçli olarak kullanılmaz: ATT izni gerektirir
 * ve kullanıcı tarafından sıfırlanabilir.
 */

const STORAGE_KEY = 'bluma.deviceId';

let cached: string | null = null;

function randomId() {
  return Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
  ).join('');
}

async function nativeId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') return Application.getAndroidId();
    return await Application.getIosIdForVendorAsync();
  } catch (error) {
    logger.error('Native device id error:', error);
    return null;
  }
}

/** Doküman id'si olarak kullanılır: `ios:<uuid>` / `android:<hex>`. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  const stored = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
  if (stored) {
    cached = stored;
    return stored;
  }

  const id = `${Platform.OS}:${(await nativeId()) || randomId()}`;
  await SecureStore.setItemAsync(STORAGE_KEY, id, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  }).catch((error) => logger.error('Device id persist error:', error));

  cached = id;
  return id;
}

/** Ban kaydına iliştirilen, hangi cihaz olduğunu insanın anlaması için bilgi. */
export function deviceLabel() {
  return `${Application.applicationName || 'Bluma'} · ${Platform.OS} ${Platform.Version}`;
}

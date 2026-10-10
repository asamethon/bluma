import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

const APP_STORE_ID_KEY = 'reviewPrompt.appStoreId';
const LOOKUP_TIMEOUT_MS = 4000;

const writeReviewUrl = (appId: string | number) =>
  `https://apps.apple.com/app/id${appId}?action=write-review`;

/** Apple'ın açık lookup ucundan App Store kimliği (bir kez çözülüp saklanır). */
async function resolveAppStoreId(bundleId: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}`,
      { signal: controller.signal },
    );
    const trackId = (await response.json())?.results?.[0]?.trackId;
    if (!trackId) return null;
    await AsyncStorage.setItem(APP_STORE_ID_KEY, String(trackId)).catch(() => {});
    return String(trackId);
  } catch (error) {
    logger.debug('App Store ID çözülemedi:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Mağaza adresi. `StoreReview.storeUrl()` yalnızca app.json'daki
 * `ios.appStoreUrl` / `android.playStoreUrl` alanlarını okur, hiçbir şey
 * türetmez — bu yüzden yapılandırma yoksa adres burada üretilir.
 */
async function resolveStoreUrl(): Promise<string | null> {
  const configured = StoreReview.storeUrl();
  if (configured) return configured;

  if (Platform.OS === 'android') {
    const androidPackage = Constants.expoConfig?.android?.package;
    return androidPackage ? `https://play.google.com/store/apps/details?id=${androidPackage}` : null;
  }
  if (Platform.OS !== 'ios') return null;

  const cached = await AsyncStorage.getItem(APP_STORE_ID_KEY).catch(() => null);
  if (cached) return writeReviewUrl(cached);

  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  if (!bundleId) return null;
  const resolved = await resolveAppStoreId(bundleId);
  return resolved ? writeReviewUrl(resolved) : null;
}

export async function canRequestReview(): Promise<boolean> {
  return (await StoreReview.hasAction()) && (await StoreReview.isAvailableAsync());
}

/**
 * Ayarlardan elle tetiklenen "Değerlendir": mağaza sayfası açılır. Adres hiçbir
 * şekilde bulunamazsa sistem değerlendirme diyaloğuna düşülür.
 */
export async function openStoreListing(): Promise<boolean> {
  try {
    const url = await resolveStoreUrl();
    if (!url) {
      if (!(await canRequestReview())) return false;
      await StoreReview.requestReview();
      return true;
    }

    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return true;
    }
    const { openBrowserAsync } = await import('expo-web-browser');
    await openBrowserAsync(url);
    return true;
  } catch (error) {
    logger.debug('Mağaza sayfası açılamadı:', error);
    return false;
  }
}

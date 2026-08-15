import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { store } from '@/store';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'reviewPrompt.state.v1';

// Değerlendirme yalnızca kullanıcı uygulamadan gerçekten fayda gördükten sonra
// istenir; sistem diyaloğu yılda sınırlı sayıda gösterildiği için "ucuz"
// anlarda harcanmamalı.
const MIN_POSITIVE_EVENTS = 3;
const MIN_DAYS_SINCE_FIRST_USE = 2;
const COOLDOWN_DAYS = 120;
const MAX_PROMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PositiveMoment =
  | 'storyPublished'
  | 'storyFinished'
  | 'challengeCompleted';

type ReviewState = {
  firstUseAt: number;
  positiveEvents: number;
  promptCount: number;
  lastPromptAt: number;
  lastPromptVersion: string | null;
};

const EMPTY: ReviewState = {
  firstUseAt: 0,
  positiveEvents: 0,
  promptCount: 0,
  lastPromptAt: 0,
  lastPromptVersion: null,
};

const currentVersion = () => Constants.expoConfig?.version ?? 'unknown';

async function readState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

async function writeState(state: ReviewState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.debug('Değerlendirme durumu yazılamadı:', error);
  }
}

/** İlk açılışta "kaç gündür kullanıyor" ölçümünü başlatır. */
async function init() {
  const state = await readState();
  if (!state.firstUseAt) {
    await writeState({ ...state, firstUseAt: Date.now() });
  }
}

/**
 * `immediate`: "birikim" eşiklerini (olumlu an sayısı + kullanım süresi) atlar.
 * İlk hikâyesini yayınlayan yazar için kullanılır — o an zaten uygulamanın
 * verdiği en büyük değer anıdır, beklemenin anlamı yok. Sıklık koruyucuları
 * (MAX_PROMPTS, cooldown, sürüm) yine de geçerlidir; onlar kullanıcıyı
 * bunaltmamak için var.
 */
function shouldPrompt(state: ReviewState, immediate = false): boolean {
  // Misafir kullanıcıya sorulmaz: henüz uygulamaya yatırım yapmamıştır.
  if (!store.getState().auth.user?.id) return false;
  if (state.promptCount >= MAX_PROMPTS) return false;
  if (state.lastPromptAt && Date.now() - state.lastPromptAt < COOLDOWN_DAYS * DAY_MS) return false;
  // Aynı sürümde ikinci kez sorulmaz (sistem zaten çoğu kez yutar).
  if (state.lastPromptVersion && state.lastPromptVersion === currentVersion()) return false;

  if (immediate) return true;

  if (state.positiveEvents < MIN_POSITIVE_EVENTS) return false;
  if (state.firstUseAt && Date.now() - state.firstUseAt < MIN_DAYS_SINCE_FIRST_USE * DAY_MS) return false;
  return true;
}

/**
 * Olumlu bir anı kaydeder ve eşikler tutuyorsa sistem değerlendirme
 * diyaloğunu ister. Sessizdir: gösterilip gösterilmediğini iOS/Android
 * belirler, kullanıcı akışı asla bloklanmaz.
 */
async function recordMoment(moment: PositiveMoment, options?: { immediate?: boolean }) {
  try {
    const state = await readState();
    const next: ReviewState = { ...state, positiveEvents: state.positiveEvents + 1 };

    if (!shouldPrompt(next, options?.immediate)) {
      await writeState(next);
      return;
    }

    const available = (await StoreReview.hasAction()) && (await StoreReview.isAvailableAsync());
    if (!available) {
      logger.debug('Değerlendirme diyaloğu bu ortamda kullanılamıyor');
      await writeState(next);
      return;
    }

    // Ekran geçişi/animasyon otursun diye kısa gecikme (diyalog çakışmasın).
    await new Promise(resolve => setTimeout(resolve, 900));
    await StoreReview.requestReview();
    logger.debug('Değerlendirme istendi:', moment);

    await writeState({
      ...next,
      promptCount: next.promptCount + 1,
      lastPromptAt: Date.now(),
      lastPromptVersion: currentVersion(),
    });
  } catch (error) {
    logger.debug('Değerlendirme istenemedi:', error);
  }
}

const APP_STORE_ID_KEY = 'reviewPrompt.appStoreId';
const writeReviewUrl = (appId: string | number) =>
  `https://apps.apple.com/app/id${appId}?action=write-review`;

/**
 * Mağaza adresi. `StoreReview.storeUrl()` yalnızca app.json'daki
 * `ios.appStoreUrl` / `android.playStoreUrl` alanlarını okur, hiçbir şey
 * türetmez — bu yüzden yapılandırma yoksa adres burada üretilir:
 * Android'de paket adından, iOS'ta Apple'ın açık lookup ucundan (bir kez
 * çözülüp yerel olarak saklanır).
 */
async function resolveStoreUrl(): Promise<string | null> {
  const configured = StoreReview.storeUrl();
  if (configured) return configured;

  const { Platform } = await import('react-native');

  if (Platform.OS === 'android') {
    const pkg = Constants.expoConfig?.android?.package;
    return pkg ? `https://play.google.com/store/apps/details?id=${pkg}` : null;
  }

  if (Platform.OS !== 'ios') return null;

  const cached = await AsyncStorage.getItem(APP_STORE_ID_KEY).catch(() => null);
  if (cached) return writeReviewUrl(cached);

  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  if (!bundleId) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const trackId = (await response.json())?.results?.[0]?.trackId;
    if (!trackId) return null;
    await AsyncStorage.setItem(APP_STORE_ID_KEY, String(trackId)).catch(() => {});
    return writeReviewUrl(trackId);
  } catch (error) {
    logger.debug('App Store ID çözülemedi:', error);
    return null;
  }
}

/**
 * Ayarlardan elle tetiklenen "Değerlendir": mağaza sayfası açılır. Adres hiçbir
 * şekilde bulunamazsa sistem değerlendirme diyaloğuna düşülür.
 */
async function openStoreListing(): Promise<boolean> {
  try {
    const url = await resolveStoreUrl();
    if (url) {
      const { Linking } = await import('react-native');
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return true;
      }
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(url);
      return true;
    }

    if ((await StoreReview.hasAction()) && (await StoreReview.isAvailableAsync())) {
      await StoreReview.requestReview();
      return true;
    }
    return false;
  } catch (error) {
    logger.debug('Mağaza sayfası açılamadı:', error);
    return false;
  }
}

export const reviewPromptActions = { init, recordMoment, openStoreListing };

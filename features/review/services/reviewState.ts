import { store } from '@/store';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY = 'reviewPrompt.state.v1';

// Değerlendirme yalnızca kullanıcı uygulamadan gerçekten fayda gördükten sonra
// istenir; sistem diyaloğu yılda sınırlı sayıda gösterildiği için "ucuz"
// anlarda harcanmamalı. Ölçüt "kaç gün geçti" DEĞİL, "kaç olumlu an yaşadı":
// W1 tutma %9,3 olduğu için 1 günlük bekleme kullanıcıların ~%91'ini eliyordu
// ve istem neredeyse hiç gösterilmiyordu (246 indirmede 8 puan). Sıklık
// koruyucuları (MAX_PROMPTS, cooldown, sürüm başına bir kez) zaten yeterli.
const MIN_POSITIVE_EVENTS = 3;
const MIN_DAYS_SINCE_FIRST_USE = 0;
const COOLDOWN_DAYS = 120;
const MAX_PROMPTS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewState = {
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

export const currentVersion = () => Constants.expoConfig?.version ?? 'unknown';

export async function readState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export async function writeState(state: ReviewState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.debug('Değerlendirme durumu yazılamadı:', error);
  }
}

/**
 * `immediate`: "birikim" eşiklerini (olumlu an sayısı + kullanım süresi) atlar.
 * İlk hikâyesini yayınlayan yazar için kullanılır — o an zaten uygulamanın
 * verdiği en büyük değer anıdır, beklemenin anlamı yok. Sıklık koruyucuları
 * (MAX_PROMPTS, cooldown, sürüm) yine de geçerlidir; onlar kullanıcıyı
 * bunaltmamak için var.
 */
export function shouldPrompt(state: ReviewState, immediate = false): boolean {
  // Misafir kullanıcıya sorulmaz: henüz uygulamaya yatırım yapmamıştır.
  if (!store.getState().auth.user?.id) return false;
  if (state.promptCount >= MAX_PROMPTS) return false;
  if (state.lastPromptAt && Date.now() - state.lastPromptAt < COOLDOWN_DAYS * DAY_MS) return false;
  // Aynı sürümde ikinci kez sorulmaz (sistem zaten çoğu kez yutar).
  if (state.lastPromptVersion === currentVersion()) return false;

  if (immediate) return true;
  if (state.positiveEvents < MIN_POSITIVE_EVENTS) return false;
  return !state.firstUseAt || Date.now() - state.firstUseAt >= MIN_DAYS_SINCE_FIRST_USE * DAY_MS;
}

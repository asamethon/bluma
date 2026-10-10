import { logger } from '@/utils/logger';
import * as StoreReview from 'expo-store-review';
import { currentVersion, readState, shouldPrompt, writeState } from './reviewState';
import { canRequestReview, openStoreListing } from './storeListing';

type PositiveMoment = 'storyPublished' | 'storyFinished' | 'chapterFinished' | 'challengeCompleted';

/** Diyalog, ekran geçişi otursun diye kısa bir gecikmeyle istenir. */
const SETTLE_DELAY_MS = 900;

/**
 * Çağrılar sıraya alınır: durum AsyncStorage'da oku-değiştir-yaz ile
 * tutulduğu için aynı anda gelen iki mutlu an (ör. bölüm bitişi + o bölümle
 * tamamlanan görev) sayacın birini yutabilir ve diyaloğu iki kez isteyebilirdi.
 */
const queue = { tail: Promise.resolve() as Promise<unknown> };

/** İlk açılışta "kaç gündür kullanıyor" ölçümünü başlatır. */
async function init() {
  const state = await readState();
  if (!state.firstUseAt) await writeState({ ...state, firstUseAt: Date.now() });
}

/**
 * Olumlu bir anı kaydeder ve eşikler tutuyorsa sistem değerlendirme
 * diyaloğunu ister. Sessizdir: gösterilip gösterilmediğini iOS/Android
 * belirler, kullanıcı akışı asla bloklanmaz.
 */
function recordMoment(moment: PositiveMoment, options?: { immediate?: boolean }) {
  const run = queue.tail.then(() => performRecord(moment, options));
  queue.tail = run.catch(() => {});
  return run;
}

async function performRecord(moment: PositiveMoment, options?: { immediate?: boolean }) {
  try {
    const state = await readState();
    const next = { ...state, positiveEvents: state.positiveEvents + 1 };

    if (!shouldPrompt(next, options?.immediate) || !(await canRequestReview())) {
      await writeState(next);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, SETTLE_DELAY_MS));
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

export const reviewPromptActions = { init, recordMoment, openStoreListing };

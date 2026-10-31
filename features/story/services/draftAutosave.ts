import { logger } from '@/utils/logger';
import type { StudioChapter } from '../utils/chapterContent';
import { saveDraft } from './chapterDraft';

export type SaveState = 'saving' | 'saved' | 'error' | null;

/** Zamanlayıcının ömrü editöre bağlıdır; çıkışta son metin arka planda kaydedilir. */
export function createDraftAutosave(storyId: string, onState: (state: SaveState) => void) {
  const work = {
    pending: null as { chapters: StudioChapter[]; revision: number } | null,
    timer: null as ReturnType<typeof setTimeout> | null,
    badge: null as ReturnType<typeof setTimeout> | null,
    revision: 0,
    active: true,
  };
  const notify = (state: SaveState) => { if (work.active) onState(state); };
  const clearTimers = () => {
    if (work.timer) clearTimeout(work.timer);
    if (work.badge) clearTimeout(work.badge);
    work.timer = null;
    work.badge = null;
  };
  const run = async () => {
    const request = work.pending;
    if (!request) return;
    clearTimers();
    work.pending = null;
    notify('saving');
    try {
      await saveDraft(storyId, request.chapters);
      if (request.revision === work.revision && !work.pending) {
        notify('saved');
        if (work.active) work.badge = setTimeout(() => notify(null), 1500);
      }
    } catch (error) {
      if (request.revision === work.revision) {
        work.pending = request;
        notify('error');
      }
      logger.warn('Taslak kaydedilemedi; tekrar denenebilir:', error);
    }
  };
  const remember = (chapters: StudioChapter[]) => {
    work.revision += 1;
    work.pending = { chapters, revision: work.revision };
  };
  return {
    start() { work.active = true; },
    schedule(chapters: StudioChapter[]) {
      clearTimers();
      remember(chapters);
      notify('saving');
      work.timer = setTimeout(() => { void run(); }, 800);
    },
    saveNow(chapters: StudioChapter[]) { remember(chapters); void run(); },
    retry: () => { void run(); },
    /** Boş taslak silinirken: bekleyen kayıt atılır, çıkışta yazılmaz. */
    discard() { work.active = false; clearTimers(); work.pending = null; },
    dispose() { work.active = false; clearTimers(); void run(); },
  };
}

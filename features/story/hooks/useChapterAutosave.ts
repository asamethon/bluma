import { useCallback, useRef, useState } from 'react';
import { saveDraft } from '../services/chapterDraft';
import type { StudioChapter } from '../utils/chapterContent';

/** Yazmayı durdurduktan bu süre sonra taslak kaydedilir. */
const AUTOSAVE_DELAY = 800;
/** "Kaydedildi" rozetinin ekranda kalma süresi. */
const SAVED_BADGE_MS = 1500;

export type SaveState = 'saving' | 'saved' | null;

/** Bölüm taslağının gecikmeli kaydı ve kayıt rozeti. */
export function useChapterAutosave(storyId: string) {
  const [saveState, setSaveState] = useState<SaveState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPending = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const run = useCallback((chapters: StudioChapter[]) =>
    saveDraft(storyId, chapters).then(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState(null), SAVED_BADGE_MS);
    }), [storyId]);

  const schedule = useCallback((chapters: StudioChapter[]) => {
    setSaveState('saving');
    cancelPending();
    timer.current = setTimeout(() => { void run(chapters); }, AUTOSAVE_DELAY);
  }, [cancelPending, run]);

  // Yapısal değişiklik (bölüm silme) beklemez: ekrandan çıkılırsa kaybolmasın.
  const saveNow = useCallback((chapters: StudioChapter[]) => {
    setSaveState('saving');
    cancelPending();
    void run(chapters);
  }, [cancelPending, run]);

  return { saveState, schedule, saveNow, cancelPending };
}

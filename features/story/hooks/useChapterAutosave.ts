import { useEffect, useMemo, useState } from 'react';
import { createDraftAutosave, type SaveState } from '../services/draftAutosave';

/** Bölüm taslağının gecikmeli kaydı ve kayıt rozeti. */
export function useChapterAutosave(storyId: string) {
  const [saveState, setSaveState] = useState<SaveState>(null);
  const autosave = useMemo(() => createDraftAutosave(storyId, setSaveState), [storyId]);
  useEffect(() => {
    autosave.start();
    return () => autosave.dispose();
  }, [autosave]);
  return { saveState, ...autosave };
}

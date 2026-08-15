import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { syncWriterReminders } from '../services/writerReminders';
import { dailyPromptKey } from '../utils/writingPrompts';
import { useQuickDraft } from './useQuickDraft';

export function useWriterActivation() {
  const { t } = useTranslation();
  const uid = useAppSelector(s => s.auth.user?.id);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const storyCount = useAppSelector(s => s.story.userStories.length);
  const { starting, startQuickDraft } = useQuickDraft();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      await storyActions.loadUserStories(uid);
      if (!alive) return;
      setLoaded(true);
      void syncWriterReminders(store.getState().story.userStories);
    })();
    return () => {
      alive = false;
    };
  }, [uid]);

  const prompt = t(dailyPromptKey());

  const startBlank = useCallback(() => startQuickDraft(), [startQuickDraft]);
  const startWithPrompt = useCallback(
    () => startQuickDraft(prompt),
    [startQuickDraft, prompt],
  );

  return {
    showCard: !!uid && !isGuest && loaded && storyCount === 0,
    prompt,
    starting,
    startBlank,
    startWithPrompt,
  };
}

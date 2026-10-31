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
  const intent = useAppSelector(s => s.auth.user?.intent);
  const storyCount = useAppSelector(s => s.story.userStories.length);
  const { starting, startQuickDraft } = useQuickDraft();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const lifecycle = { active: true };
    (async () => {
      await storyActions.loadUserStories(uid);
      if (!lifecycle.active) return;
      setLoaded(true);
      void syncWriterReminders(store.getState().story.userStories, intent);
    })();
    return () => {
      lifecycle.active = false;
    };
  }, [intent, uid]);

  const prompt = t(dailyPromptKey());

  const startBlank = useCallback(() => startQuickDraft(), [startQuickDraft]);
  const startWithPrompt = useCallback(
    () => startQuickDraft(prompt),
    [startQuickDraft, prompt],
  );

  return {
    // "Okur" niyeti seçene ana sayfada yazma kartı gösterilmez.
    showCard: !!uid && !isGuest && loaded && storyCount === 0 && intent !== 'reader',
    prompt,
    starting,
    startBlank,
    startWithPrompt,
  };
}

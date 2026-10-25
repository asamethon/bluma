import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { defaultChapterTitle } from '../utils/chapterContent';

export function useQuickDraft() {
  const router = useRouter();
  const uid = useAppSelector(s => s.auth.user?.id);
  const userStories = useAppSelector(s => s.story.userStories);
  const [starting, setStarting] = useState(false);
  const inFlight = useRef(false);

  const startQuickDraft = useCallback(
    async (promptText?: string) => {
      if (!uid || inFlight.current) return;
      inFlight.current = true;
      setStarting(true);
      try {
        const existingDraft = userStories.find(
          s => !s.isPublished && s.title === i18n.t('studio.untitledStory') && (s.chaptersCount || 1) <= 1 && (!s.content || s.content.trim().length === 0),
        );
        if (existingDraft?.id) {
          router.push(`/story/compose/${existingDraft.id}?ch=0`);
          return;
        }

        const result = await storyActions.createStory({
          title: i18n.t('studio.untitledStory'),
          description: '',
          content: promptText ? `${promptText.trim()}\n\n` : '',
          category: 'other',
          tags: [],
          isCompleted: false,
          isPublished: false,
          chaptersCount: 1,
          chapterTitles: [defaultChapterTitle(1)],
          readingTime: 1,
          isPremium: false,
          authorId: uid,
          isBook: false,
        } as any);
        if (result.success && result.storyId) {
          router.push(`/story/compose/${result.storyId}?ch=0`);
        } else {
          Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.createFailed'));
        }
      } finally {
        inFlight.current = false;
        setStarting(false);
      }
    },
    [uid, router, userStories],
  );

  return { starting, startQuickDraft };
}

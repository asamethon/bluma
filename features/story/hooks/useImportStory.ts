import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { challengeActions } from '@/store/challengeStore';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { StoryCategory } from '@/types';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { autoSplitPastedText, StudioChapter } from '../utils/chapterContent';
import { readingMinutes, wordCount } from '../utils/textStats';

export function useImportStory() {
  const router = useRouter();
  const uid = useAppSelector(s => s.auth.user?.id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StoryCategory>('other');
  const [pastedText, setPastedText] = useState('');
  const [publishing, setPublishing] = useState(false);

  const chapters: StudioChapter[] = useMemo(
    () => autoSplitPastedText(pastedText),
    [pastedText]
  );

  const totalWords = useMemo(
    () => chapters.reduce((sum, c) => sum + wordCount(c.content), 0),
    [chapters]
  );

  const publish = async () => {
    if (!uid) {
      Alert.alert(i18n.t('studio.loginRequiredTitle'), i18n.t('studio.loginRequiredMessage'));
      return;
    }
    if (title.trim().length < 3) {
      Alert.alert(i18n.t('studio.titleMissingTitle'), i18n.t('studio.titleMissingMessage'));
      return;
    }
    if (category === 'other') {
      Alert.alert(i18n.t('studio.pickGenreTitle'), i18n.t('studio.pickGenreShortMessage'));
      return;
    }
    if (chapters.length === 0) {
      Alert.alert(i18n.t('studio.contentMissingTitle'), i18n.t('studio.contentMissingMessage'));
      return;
    }

    setPublishing(true);
    try {
      const readingTime = readingMinutes(chapters.map(c => c.content).join('\n\n'));
      const result = await storyActions.createStory({
        title: title.trim(),
        description: '',
        category,
        tags: [],
        isCompleted: false,
        isPublished: true,
        chaptersCount: chapters.length,
        chapterTitles: chapters.map(c => c.title),
        readingTime,
        isPremium: false,
        authorId: uid,
        isBook: chapters.length > 1,
      } as any);

      if (!result.success || !result.storyId) {
        Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.createFailed'));
        return;
      }

      await storyActions.saveChapters(result.storyId, chapters);
      await storyActions.updateStory(result.storyId, {
        chaptersInSubcollection: true,
        chapterWordCounts: chapters.map(c => wordCount(c.content)),
      });

      if (uid) challengeActions.trackAction(uid, 'storiesPublished').catch(() => {});

      // Değerlendirme, kendi uyarımız kapandıktan SONRA istenir ki iki diyalog
      // üst üste binmesin.
      Alert.alert(
        i18n.t('studio.publishedTitle'),
        i18n.t('studio.importPublished', { title: title.trim(), count: chapters.length }),
        [{
          text: i18n.t('common.ok'),
          onPress: () => {
            if (uid) reviewPromptActions.recordMoment('storyPublished').catch(() => {});
          },
        }]
      );
      router.replace(`/story/${result.storyId}` as any);
    } finally {
      setPublishing(false);
    }
  };

  return {
    title, setTitle,
    category, setCategory,
    pastedText, setPastedText,
    chapters, totalWords,
    publishing, publish,
    cancel: () => router.back(),
  };
}

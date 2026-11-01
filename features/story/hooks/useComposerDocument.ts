import i18n from '@/i18n';
import { storyActions } from '@/store/storyStore';
import type { Story, StoryCategory } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { Alert } from 'react-native';
import { newChapter, openStory } from '../services/storyDraft';
import type { StudioChapter } from '../utils/chapterContent';
import { useChapterAutosave } from './useChapterAutosave';
import { useChapterEditor } from './useChapterEditor';
import { useMediaInsert } from './useMediaInsert';
import { sameChapters } from '../services/chapterMetadata';

type DocumentState = {
  story: Story | null;
  chapters: StudioChapter[];
  publishedChapters: StudioChapter[];
  index: number;
  category: StoryCategory;
  isPublished: boolean;
  loading: boolean;
};

const INITIAL: DocumentState = {
  story: null,
  chapters: [],
  publishedChapters: [],
  index: 0,
  category: 'other',
  isPublished: false,
  loading: true,
};

/** Bölüm içeriği, otomatik kayıt ve zengin metin editörünü tek yerde tutar. */
export function useComposerDocument(storyId: string, chapterParam?: string) {
  const router = useRouter();
  const [state, patch] = useReducer(
    (current: DocumentState, next: Partial<DocumentState>) => ({ ...current, ...next }),
    INITIAL,
  );
  const { saveState, schedule, saveNow, retry } = useChapterAutosave(storyId);
  const hasUnpublishedChanges = useMemo(() => !state.isPublished || !sameChapters(state.chapters, state.publishedChapters),
    [state.chapters, state.isPublished, state.publishedChapters]);

  const commitChapters = (chapters: StudioChapter[], extra?: Partial<DocumentState>) => {
    patch({ chapters, ...extra });
    schedule(chapters);
  };

  const commitChaptersNow = (chapters: StudioChapter[], extra?: Partial<DocumentState>) => {
    patch({ chapters, ...extra });
    saveNow(chapters);
  };

  const editCurrent = (fields: Partial<StudioChapter>) =>
    commitChapters(state.chapters.map((chapter, i) => (i === state.index ? { ...chapter, ...fields } : chapter)));

  const editor = useChapterEditor((content: string) => editCurrent({ content }));
  const media = useMediaInsert(editor.insertSnippet);
  const loadEditor = editor.load;

  useEffect(() => {
    const lifecycle = { active: true };
    void openStory(storyId, chapterParam).then(opened => {
      if (!lifecycle.active) return;
      if (!opened) {
        Alert.alert(i18n.t('common.error'), i18n.t('story.notFound'));
        router.back();
        return;
      }
      patch({ ...opened, loading: false });
      loadEditor(opened.chapters[opened.index]?.content ?? '');
    }).catch(() => {
      if (!lifecycle.active) return;
      Alert.alert(i18n.t('studio.draftOpenFailedTitle'), i18n.t('studio.draftOpenFailedMessage'));
      router.back();
    });
    return () => {
      lifecycle.active = false;
    };
  }, [chapterParam, loadEditor, router, storyId]);

  // Bilgi ekranından dönüldüğünde başlık/kategori tazelenir.
  useFocusEffect(useCallback(() => {
    const lifecycle = { active: true };
    void storyActions.getStoryById(storyId).then(story => {
      if (lifecycle.active && story) patch({ story, category: story.category || 'other' });
    });
    return () => { lifecycle.active = false; };
  }, [storyId]));

  const goToChapter = (index: number, chapters = state.chapters) => {
    patch({ index });
    editor.load(chapters[index]?.content ?? '');
  };

  return {
    ...state,
    saveState,
    hasUnpublishedChanges,
    retrySave: retry,
    editor,
    media,
    markPublished: (chapters: StudioChapter[]) => patch({ isPublished: true, publishedChapters: chapters }),
    setChapterTitle: (title: string) => editCurrent({ title }),
    switchTo: (index: number) => goToChapter(index),
    addChapter: () => {
      const chapters = [...state.chapters, newChapter(state.chapters.length + 1)];
      commitChapters(chapters, { index: chapters.length - 1 });
      editor.load('');
    },
    deleteChapter: () => {
      if (state.chapters.length <= 1) {
        Alert.alert(i18n.t('studio.cannotDeleteTitle'), i18n.t('studio.cannotDeleteMessage'));
        return;
      }
      Alert.alert(i18n.t('studio.deleteChapterTitle'), i18n.t('studio.deleteChapterMessage'), [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const chapters = state.chapters.filter((_, i) => i !== state.index);
            const index = Math.max(0, state.index - 1);
            commitChaptersNow(chapters, { index });
            editor.load(chapters[index]?.content ?? '');
          },
        },
      ]);
    },
  };
}

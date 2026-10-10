import i18n from '@/i18n';
import { storyActions } from '@/store/storyStore';
import type { Story, StoryCategory } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useReducer } from 'react';
import { Alert } from 'react-native';
import { newChapter, openStory } from '../services/storyDraft';
import type { StudioChapter } from '../utils/chapterContent';
import { useChapterAutosave } from './useChapterAutosave';
import { useChapterEditor } from './useChapterEditor';

type DocumentState = {
  story: Story | null;
  chapters: StudioChapter[];
  index: number;
  category: StoryCategory;
  isPublished: boolean;
  loading: boolean;
};

const INITIAL: DocumentState = {
  story: null,
  chapters: [],
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
  const { saveState, schedule, saveNow, cancelPending } = useChapterAutosave(storyId);

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
    });
    return () => {
      lifecycle.active = false;
      cancelPending();
    };
  }, [cancelPending, chapterParam, loadEditor, router, storyId]);

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
    editor,
    cancelPendingSave: cancelPending,
    markPublished: () => patch({ isPublished: true }),
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

import { useRouter } from 'expo-router';
import { useReducer } from 'react';
import { charCount, readingMinutes, wordCount } from '../utils/textStats';
import { useComposerDocument } from './useComposerDocument';
import { useComposerPublish } from './useComposerPublish';

type Panels = { focus: boolean; sheet: boolean; preview: boolean };
const CLOSED: Panels = { focus: false, sheet: false, preview: false };

/** Editör ekranının tek giriş noktası: belge + yayın + panel durumları. */
export function useComposer(id: string, chParam?: string) {
  const router = useRouter();
  const doc = useComposerDocument(id, chParam);
  const [panels, setPanels] = useReducer(
    (current: Panels, next: Partial<Panels>) => ({ ...current, ...next }),
    CLOSED,
  );

  const { publish, publishing } = useComposerPublish({
    storyId: id,
    story: doc.story,
    chapters: doc.chapters,
    category: doc.category,
    isPublished: doc.isPublished,
    announcedCount: doc.announcedCount,
    beforePublish: doc.cancelPendingSave,
    onPublished: () => doc.markPublished(doc.chapters.length),
  });

  const { editor } = doc;
  return {
    story: doc.story,
    loading: doc.loading,
    chapters: doc.chapters,
    index: doc.index,
    cur: doc.chapters[doc.index],
    isPublished: doc.isPublished,
    hasUnpublishedChapter: doc.isPublished && doc.chapters.length > doc.announcedCount,
    saveState: doc.saveState,
    setChapterTitle: doc.setChapterTitle,
    switchTo: (index: number) => { doc.switchTo(index); setPanels({ sheet: false }); },
    addChapter: () => { doc.addChapter(); setPanels({ sheet: false }); },
    deleteChapter: doc.deleteChapter,
    publish,
    publishing,

    ...panels,
    toggleFocus: () => setPanels({ focus: !panels.focus }),
    setSheet: (sheet: boolean) => setPanels({ sheet }),
    setPreview: (preview: boolean) => setPanels({ preview }),

    imageUploading: editor.imageUploading,
    words: wordCount(editor.display),
    chars: charCount(editor.display),
    readMin: readingMinutes(editor.display),
    bodyDisplay: editor.display,
    bodyRanges: editor.ranges,
    italicMode: editor.italicMode,
    bulletMode: editor.bulletMode,
    forcedSel: editor.forcedSel,
    onChangeBody: editor.onChangeText,
    onBodySelectionChange: editor.onSelectionChange,
    toggleItalic: editor.toggleItalic,
    toggleBullet: editor.toggleBullet,
    insertAtCursor: editor.insertSnippet,
    insertImage: editor.insertImage,
    editInfo: () => router.push(`/story/edit/${id}`),
    back: () => router.back(),
  };
}

/** Editör ekranının bileşenlerine geçirilen model. */
export type ComposerModel = ReturnType<typeof useComposer>;

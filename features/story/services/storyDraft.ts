import { storyActions } from '@/store/storyStore';
import { defaultChapterTitle, splitChapters, type StudioChapter } from '../utils/chapterContent';
import { loadChapterDraft } from './chapterDraftStorage';
import { waitForChapterWrites } from './chapterWriteQueue';

export const newChapter = (order: number): StudioChapter => ({
  id: `${Date.now()}`,
  title: defaultChapterTitle(order),
  content: '',
});

/** Editörü açarken hikâyeyi ve bölümlerini hazırlar; yoksa null döner. */
export async function openStory(storyId: string, chapterParam?: string) {
  await waitForChapterWrites(storyId);
  const story = await storyActions.getStoryById(storyId);
  if (!story) return null;

  const [published, draft] = await Promise.all([
    story.chaptersInSubcollection
      ? storyActions.loadAllChapters(storyId)
      : Promise.resolve(splitChapters(story.content, story.chapterTitles)),
    loadChapterDraft(storyId),
  ]);
  const loaded = draft ?? published;
  const stored = loaded.length > 0 ? loaded : [newChapter(1)];
  const opened = {
    story,
    category: story.category || 'other',
    isPublished: !!story.isPublished,
    publishedChapters: story.isPublished ? published : [],
  };

  if (chapterParam === 'new') {
    const chapters = [...stored, newChapter(stored.length + 1)];
    return { ...opened, chapters, index: chapters.length - 1 };
  }
  const wanted = parseInt(chapterParam || '0', 10) || 0;
  return { ...opened, chapters: stored, index: Math.max(0, Math.min(stored.length - 1, wanted)) };
}

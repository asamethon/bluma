import { storyActions } from '@/store/storyStore';
import { defaultChapterTitle, splitChapters, type StudioChapter } from '../utils/chapterContent';

export const newChapter = (order: number): StudioChapter => ({
  id: `${Date.now()}`,
  title: defaultChapterTitle(order),
  content: '',
});

/** Editörü açarken hikâyeyi ve bölümlerini hazırlar; yoksa null döner. */
export async function openStory(storyId: string, chapterParam?: string) {
  const story = await storyActions.getStoryById(storyId);
  if (!story) return null;

  const loaded = story.chaptersInSubcollection
    ? await storyActions.loadAllChapters(storyId)
    : splitChapters(story.content, story.chapterTitles);
  const stored = loaded.length > 0 ? loaded : [newChapter(1)];
  const opened = {
    story,
    category: story.category || 'other',
    isPublished: !!story.isPublished,
    // Takipçilere duyurulmuş bölüm sayısı — "yayımlanmamış bölüm var mı?"
    // sorusunun yanıtı. Otomatik kayıt `chaptersCount`'u da yazdığı için
    // bu temel değer oturum boyunca sabit tutulur, Firestore'dan tazelenmez.
    announcedCount: story.announcedChaptersCount
      ?? (story.isPublished ? story.chaptersCount || stored.length : 0),
  };

  if (chapterParam === 'new') {
    const chapters = [...stored, newChapter(stored.length + 1)];
    return { ...opened, chapters, index: chapters.length - 1 };
  }
  const wanted = parseInt(chapterParam || '0', 10) || 0;
  return { ...opened, chapters: stored, index: Math.max(0, Math.min(stored.length - 1, wanted)) };
}

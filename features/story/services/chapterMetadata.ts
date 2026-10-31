import type { Story } from '@/types';
import { joinChapters, type StudioChapter } from '../utils/chapterContent';
import { readingMinutes, wordCount } from '../utils/textStats';

export function chapterMetadata(chapters: StudioChapter[]) {
  return {
    chapterTitles: chapters.map(chapter => chapter.title),
    chapterWordCounts: chapters.map(chapter => wordCount(chapter.content)),
    chaptersCount: chapters.length,
    isBook: chapters.length > 1,
    readingTime: readingMinutes(joinChapters(chapters)),
    chaptersInSubcollection: true,
  };
}

export type DraftSummary = ReturnType<typeof chapterMetadata>;

export function sameChapters(first: StudioChapter[], second: StudioChapter[]) {
  return first.length === second.length && first.every((chapter, index) => {
    const other = second[index];
    return chapter.id === other.id && chapter.title === other.title && chapter.content === other.content;
  });
}

/**
 * Silip tekrar eklemek, daha önce duyurulmuş bölüm sayısını geriye çekmez.
 * Yayından kaldırılıp yeniden yayınlanan hikâye de takipçilere ikinci kez
 * "yeni hikâye" olarak duyurulmaz (`announceStory`).
 */
export function chapterPublication(current: Pick<Story, 'isPublished' | 'chaptersCount' | 'lastNotifiedChapterCount'>, count: number) {
  const previous = Math.max(current.lastNotifiedChapterCount || 0, current.isPublished ? current.chaptersCount || 1 : 0);
  return {
    firstPublish: !current.isPublished,
    announceStory: !current.isPublished && !current.lastNotifiedChapterCount,
    newChapterNumber: current.isPublished && count > previous ? count : undefined,
    lastNotifiedChapterCount: Math.max(previous, count),
  };
}

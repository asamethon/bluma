import { storyActions } from '@/store/storyStore';
import { joinChapters, type StudioChapter } from '../utils/chapterContent';
import { readingMinutes, wordCount } from '../utils/textStats';

/** Bölüm listesinden üretilen hikâye üstverisi; taslak ve yayın aynı şemayı yazar. */
function chapterMetadata(chapters: StudioChapter[]) {
  return {
    chapterTitles: chapters.map(chapter => chapter.title),
    chapterWordCounts: chapters.map(chapter => wordCount(chapter.content)),
    chaptersCount: chapters.length,
    isBook: chapters.length > 1,
    readingTime: readingMinutes(joinChapters(chapters)),
    chaptersInSubcollection: true,
  };
}

export async function saveDraft(storyId: string, chapters: StudioChapter[]) {
  await Promise.all([
    storyActions.saveChapters(storyId, chapters),
    storyActions.updateStory(storyId, chapterMetadata(chapters)),
  ]);
}

/**
 * Açık "Yayınla" aksiyonu. Takipçi duyurusu YALNIZCA buradan tetiklenir —
 * otomatik kayıt (`saveDraft`) aynı alanları yazar ama duyuru izni vermez.
 */
export async function publishDraft(
  storyId: string,
  chapters: StudioChapter[],
  announcedBefore?: number,
) {
  await storyActions.saveChapters(storyId, chapters);
  return storyActions.updateStory(
    storyId,
    { ...chapterMetadata(chapters), isPublished: true },
    { announce: true, announcedBefore },
  );
}

import i18n from '@/i18n';
import type { Story } from '@/types';
import { defaultChapterTitle, type StudioChapter } from './chapterContent';

const untitled = { titles: null as Set<string> | null };

/** Hızlı taslağın herhangi bir dildeki varsayılan adı ("Adsız hikâye"). */
export function isUntitledTitle(title?: string | null): boolean {
  if (!title?.trim()) return true;
  // Çeviri kaynakları paket içindedir ve değişmez: küme bir kez kurulur.
  untitled.titles ??= new Set(Object.keys(i18n.options.resources ?? {})
    .map(language => i18n.getFixedT(language)('studio.untitledStory')));
  return untitled.titles.has(title);
}

/**
 * "Yeni hikâye" dokunuşu hemen bir taslak açar. Kullanıcı hiçbir şey
 * yazmadan çıkarsa taslak boştur: varsayılan başlık ve bölüm adları; metin,
 * açıklama ve kapak yok. Yalnızca böyle bir taslak kendiliğinden silinir.
 */
export function isAbandonedDraft(
  story: Pick<Story, 'isPublished' | 'title' | 'description' | 'coverImage'> | null,
  chapters: StudioChapter[],
): boolean {
  // Yazarken her tuşta çağrılır: en ucuz ve en sık yanlışlanan koşul önce.
  return !!story && !story.isPublished
    && chapters.every((chapter, index) =>
      !chapter.content.trim() && chapter.title === defaultChapterTitle(index + 1))
    && !story.description?.trim()
    && !story.coverImage
    && isUntitledTitle(story.title);
}

import { parseImageToken, stripImageTokens } from './imageToken';

const CHAPTER_SEPARATOR = '\n§§\n';

const decodeHtml = (value: string) => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n\n')
  .replace(/<\/div>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export function splitStoryChapters(content: string, expectedCount = 1): string[] {
  const clean = decodeHtml(content || '');
  if (!clean) return [];
  if (clean.includes(CHAPTER_SEPARATOR)) {
    return clean.split(CHAPTER_SEPARATOR).filter(chapter => chapter.trim());
  }

  const paragraphs = clean.split('\n\n').filter(paragraph => paragraph.trim());
  if (!paragraphs.length) return [clean];
  if (expectedCount <= 1) return [paragraphs.join('\n\n')];
  if (paragraphs.length <= expectedCount) return paragraphs;

  const chunkSize = Math.ceil(paragraphs.length / expectedCount);
  return Array.from({ length: expectedCount }, (_, index) => (
    paragraphs.slice(index * chunkSize, (index + 1) * chunkSize).join('\n\n')
  )).filter(Boolean);
}

export function buildReaderParagraphs(content: string, preview: boolean) {
  const all = content.split('\n\n').filter(paragraph => paragraph.trim());
  const paragraphs = preview ? all.slice(0, 2) : all;
  return {
    paragraphs,
    firstTextIndex: paragraphs.findIndex(paragraph => !parseImageToken(paragraph)),
  };
}

export const estimateReadingMinutes = (content: string) => Math.max(
  1,
  Math.ceil(stripImageTokens(content).split(/\s+/).filter(Boolean).length / 200),
);

export type ReaderChapter = { id: string; index: number; title: string | null };

/** Okuyucu içindekiler listesi: başlık yoksa numara künyesi bileşende üretilir. */
export function buildChapterList(titles: string[] | undefined, total: number): ReaderChapter[] {
  return Array.from({ length: Math.max(1, total) }, (_, index) => ({
    id: `chapter-${index}`,
    index,
    title: titles?.[index]?.trim() || null,
  }));
}

export const formatCompactCount = (value = 0) => (
  value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}b` : String(value)
);

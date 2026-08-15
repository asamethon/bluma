import i18n from '@/i18n';

export type StudioChapter = { id: string; title: string; content: string };

export const defaultChapterTitle = (number: number) => i18n.t('story.chapterN', { number });

export const CHAPTER_SEP = '\n§§\n';

export function splitChapters(content?: string, chapterTitles?: string[]): StudioChapter[] {
  const raw = content ?? '';
  const titles = chapterTitles && chapterTitles.length > 0 ? chapterTitles : [];

  if (titles.length <= 1 && !raw.includes(CHAPTER_SEP)) {
    return [{ id: '1', title: titles[0] || defaultChapterTitle(1), content: raw }];
  }

  const count = Math.max(titles.length, 1);
  let bodies: string[];
  if (raw.includes(CHAPTER_SEP)) {
    bodies = raw.split(CHAPTER_SEP);
  } else {
    const paras = raw.split('\n\n').filter(p => p.trim().length > 0);
    const perChap = Math.ceil(paras.length / count) || 1;
    bodies = Array.from({ length: count }, (_, i) =>
      paras.slice(i * perChap, (i + 1) * perChap).join('\n\n'),
    );
  }

  const n = Math.max(count, bodies.length);
  return Array.from({ length: n }, (_, i) => ({
    id: (i + 1).toString(),
    title: titles[i] || defaultChapterTitle(i + 1),
    content: bodies[i] || '',
  }));
}

export function joinChapters(chapters: StudioChapter[]): string {
  return chapters.map(c => c.content).join(CHAPTER_SEP);
}

const CHAPTER_HEADING_RE = /^(bölüm|chapter)\s*\d+\b.*$|^\d+[\.\)]\s*.+$/im;

export function autoSplitPastedText(raw: string): StudioChapter[] {
  const clean = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  if (clean.includes(CHAPTER_SEP)) {
    return clean
      .split(CHAPTER_SEP)
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map((content, i) => ({ id: (i + 1).toString(), title: defaultChapterTitle(i + 1), content }));
  }

  const lines = clean.split('\n');
  const headingIndexes: number[] = [];
  lines.forEach((line, i) => {
    if (CHAPTER_HEADING_RE.test(line.trim()) && line.trim().length < 80) {
      headingIndexes.push(i);
    }
  });

  if (headingIndexes.length < 2) {
    return [{ id: '1', title: defaultChapterTitle(1), content: clean }];
  }

  return headingIndexes.map((startIdx, i) => {
    const endIdx = i + 1 < headingIndexes.length ? headingIndexes[i + 1] : lines.length;
    const title = lines[startIdx].trim().replace(/^\d+[\.\)]\s*/, '') || defaultChapterTitle(i + 1);
    const content = lines.slice(startIdx + 1, endIdx).join('\n').trim();
    return { id: (i + 1).toString(), title, content };
  }).filter(c => c.content.length > 0);
}

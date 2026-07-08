// Bölüm içeriği yardımcıları — tek bir Story dokümanı, bölümleri benzersiz
// `\n§§\n` ayracıyla birleştirilmiş tek `content` string'inde tutar. Okuyucu
// (app/story/[id].tsx) ve Yazı Stüdyosu bu aynı mantığı paylaşır; daha önce
// split/join dört ayrı yerde kopyalanmıştı.

export type StudioChapter = { id: string; title: string; content: string };

export const CHAPTER_SEP = '\n§§\n';

// Story.content + chapterTitles → düzenlenebilir bölüm dizisi.
// Yeni format ayraçla bölünür; eski (ayraçsız) içerikte paragraflar bölüm
// sayısına eşit dağıtılır — naif \n\n bölmesi her paragrafı ayrı bölüm sanardı.
export function splitChapters(content?: string, chapterTitles?: string[]): StudioChapter[] {
  const raw = content ?? '';
  const titles = chapterTitles && chapterTitles.length > 0 ? chapterTitles : [];

  // Tek bölümlü / hızlı yazım
  if (titles.length <= 1 && !raw.includes(CHAPTER_SEP)) {
    return [{ id: '1', title: titles[0] || 'Bölüm 1', content: raw }];
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
    title: titles[i] || `Bölüm ${i + 1}`,
    content: bodies[i] || '',
  }));
}

// Bölüm dizisi → tek `content` string'i.
export function joinChapters(chapters: StudioChapter[]): string {
  return chapters.map(c => c.content).join(CHAPTER_SEP);
}

// Wattpad'den (veya başka bir kaynaktan) yapıştırılan tek bir metin bloğunu
// otomatik olarak bölümlere ayırır — "Hikâyeni Taşı" akışı (bkz.
// YAPILACAKLAR 2.6). Sezgi sırası:
//  1) Zaten `§§` ayracı varsa onunla böl.
//  2) "Bölüm 1", "1. Bölüm", "Chapter 1" gibi başlık satırlarını tanı.
//  3) Hiçbiri yoksa tüm metni tek bölüm say.
const CHAPTER_HEADING_RE = /^(bölüm|chapter)\s*\d+\b.*$|^\d+[\.\)]\s*.+$/im;

export function autoSplitPastedText(raw: string): StudioChapter[] {
  const clean = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  if (clean.includes(CHAPTER_SEP)) {
    return clean
      .split(CHAPTER_SEP)
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map((content, i) => ({ id: (i + 1).toString(), title: `Bölüm ${i + 1}`, content }));
  }

  const lines = clean.split('\n');
  const headingIndexes: number[] = [];
  lines.forEach((line, i) => {
    if (CHAPTER_HEADING_RE.test(line.trim()) && line.trim().length < 80) {
      headingIndexes.push(i);
    }
  });

  // En az 2 başlık bulunmadıysa (ör. metnin ortasında rastgele bir sayı
  // satırı) güvenilir sayılmaz — tek bölüm olarak bırak.
  if (headingIndexes.length < 2) {
    return [{ id: '1', title: 'Bölüm 1', content: clean }];
  }

  return headingIndexes.map((startIdx, i) => {
    const endIdx = i + 1 < headingIndexes.length ? headingIndexes[i + 1] : lines.length;
    const title = lines[startIdx].trim().replace(/^\d+[\.\)]\s*/, '') || `Bölüm ${i + 1}`;
    const content = lines.slice(startIdx + 1, endIdx).join('\n').trim();
    return { id: (i + 1).toString(), title, content };
  }).filter(c => c.content.length > 0);
}

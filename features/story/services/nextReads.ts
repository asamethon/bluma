import { Story } from '@/types';

/**
 * "Sırada ne okusam?" — biten hikâyeye BENZEYENİ bulur.
 *
 * `recommendations.ts`'ten farkı: orası kullanıcının zevk profilini (beğeni,
 * okuma geçmişi, ilgi alanları) ister ve sinyal yoksa boş döner. Hikâye
 * sonunda ise elimizde çok daha güçlü ve anlık bir sinyal var: kullanıcının
 * az önce sonuna kadar okuduğu hikâye. Bu yüzden burada profil aranmaz —
 * ilk gün gelen, hiç beğenisi olmayan okur da öneri görür.
 */

const SAME_AUTHOR = 6;
const SAME_CATEGORY = 3;
const PER_SHARED_TAG = 2;
const SAME_LANGUAGE = 1.5;
const DIFFERENT_LANGUAGE = 0.4;

export type NextReadsOptions = {
  /** Okurun kendi hikâyeleri önerilmez. */
  viewerId?: string;
  limit?: number;
};

function normalizeTags(tags?: string[]): Set<string> {
  const out = new Set<string>();
  for (const tag of tags || []) {
    const key = tag.trim().toLowerCase();
    if (key) out.add(key);
  }
  return out;
}

function sameLanguage(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const base = (l: string) => l.toLowerCase().split('-')[0];
  return base(a) === base(b);
}

/** Etkileşim, yakınlık eşit olduğunda sıralamayı belirleyen ikincil sinyal. */
function popularity(story: Story): number {
  const engagement =
    (story.likesCount || 0) * 3 + (story.commentsCount || 0) * 5 + (story.viewsCount || 0) * 0.1;
  return Math.log10(1 + engagement);
}

export function scoreNextRead(candidate: Story, finished: Story, viewerId?: string): number {
  if (candidate.id === finished.id) return 0;
  if (!candidate.isPublished || candidate.isHidden) return 0;
  if (viewerId && candidate.authorId === viewerId) return 0;

  let affinity = 0;
  if (candidate.authorId && candidate.authorId === finished.authorId) affinity += SAME_AUTHOR;
  if (candidate.category && candidate.category === finished.category) affinity += SAME_CATEGORY;

  const finishedTags = normalizeTags(finished.tags);
  if (finishedTags.size) {
    for (const tag of normalizeTags(candidate.tags)) {
      if (finishedTags.has(tag)) affinity += PER_SHARED_TAG;
    }
  }

  // Hiçbir ortak nokta yoksa öneri değil, doldurmadır — gösterme.
  if (affinity <= 0) return 0;

  const languageFactor = !candidate.language
    ? 1
    : sameLanguage(candidate.language, finished.language)
      ? SAME_LANGUAGE
      : DIFFERENT_LANGUAGE;

  return (affinity + popularity(candidate)) * languageFactor;
}

/**
 * Adaylar zaten bellekteki `discoverStories` havuzudur — ek Firestore okuması
 * yapılmaz, yeni indeks gerekmez.
 */
export function getNextReads(
  candidates: Story[],
  finished: Story,
  options: NextReadsOptions = {}
): Story[] {
  const { viewerId, limit = 6 } = options;

  return candidates
    .map(story => ({ story, score: scoreNextRead(story, finished, viewerId) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.story);
}

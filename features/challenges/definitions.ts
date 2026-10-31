export type Pillar = 'write' | 'read' | 'comment';

/**
 * Görev olayları. Her olay bir ANAHTAR taşır ve aynı anahtar bir görevde
 * yalnızca bir kez sayılır: tekrar okunan bölüm, aynı hikâyeye ikinci yorum
 * ya da takip et-bırak-tekrar takip et döngüsü ilerlemeyi şişirmez.
 */
export type Tracker =
  | 'storiesPublished'  // ilk kez yayınlanan hikâye — anahtar: hikâye
  | 'publishDays'       // yayın yapılan gün — anahtar: gün
  | 'storiesCompleted'  // yayındaki hikâye "Tamamlandı" işaretlendi — anahtar: hikâye
  | 'chaptersRead'      // sonuna kadar okunan bölüm — anahtar: hikâye:bölüm
  | 'storiesFinished'   // tamamlanmış hikâyenin son bölümü bitti — anahtar: hikâye
  | 'newAuthorsRead'    // takip edilmeyen yazarın hikâyesi açıldı — anahtar: yazar
  | 'commentsPosted'    // başkasının hikâyesine yorum — anahtar: hikâye
  | 'firstComments'     // hikâyenin ilk yorumu — anahtar: hikâye
  | 'newFollows'        // yeni takip — anahtar: kullanıcı
  | 'storiesLiked';     // beğenilen hikâye — anahtar: hikâye

export interface ChallengeDef {
  id: string;
  pillar: Pillar;
  icon: string;
  title: string;
  desc: string;
  goal: number;
  xp: number;
  tracker: Tracker;
  /** weekly: ilerleme ve ödül her pazartesi sıfırlanır. once: kalıcı, bir kez. */
  repeat: 'weekly' | 'once';
  badge?: string;
}

export const RANKS = [
  { name: 'challenges.ranks.newPen', min: 0, icon: 'pencil-outline' },
  { name: 'challenges.ranks.reader', min: 500, icon: 'book-outline' },
  { name: 'challenges.ranks.commenter', min: 1200, icon: 'chatbubbles-outline' },
  { name: 'challenges.ranks.narrator', min: 2500, icon: 'create-outline' },
  { name: 'challenges.ranks.storyteller', min: 3500, icon: 'library-outline' },
  { name: 'challenges.ranks.novelist', min: 5200, icon: 'bookmarks-outline' },
  { name: 'challenges.ranks.masterPen', min: 8000, icon: 'trophy-outline' },
];

const def = (
  id: string, pillar: Pillar, icon: string, goal: number, xp: number,
  tracker: Tracker, repeat: ChallengeDef['repeat'], badge = false,
): ChallengeDef => ({
  id, pillar, icon, goal, xp, tracker, repeat,
  title: `challenges.defs.${id}.title`,
  desc: `challenges.defs.${id}.desc`,
  ...(badge ? { badge: `challenges.defs.${id}.badge` } : {}),
});

/**
 * Kimlikler ve ödüller `firestore.rules` içindeki görev listeleriyle eşleşir
 * (bkz. __tests__/challenges.test.ts) — kural, XP'yi yalnızca geçerli bir
 * görev talebiyle ve en fazla tek görevin ödülü kadar artırır.
 */
export const CHALLENGE_DEFS: ChallengeDef[] = [
  def('w1', 'write', 'create-outline', 3, 150, 'storiesPublished', 'weekly'),
  def('w2', 'write', 'flame-outline', 5, 200, 'publishDays', 'weekly'),
  def('w3', 'write', 'checkmark-done-outline', 1, 300, 'storiesCompleted', 'once', true),
  def('w4', 'write', 'bulb-outline', 1, 100, 'storiesPublished', 'once'),
  def('r1', 'read', 'book-outline', 5, 80, 'chaptersRead', 'weekly'),
  def('r2', 'read', 'checkmark-circle-outline', 1, 150, 'storiesFinished', 'weekly'),
  def('r3', 'read', 'time-outline', 10, 120, 'chaptersRead', 'weekly'),
  def('r4', 'read', 'compass-outline', 1, 100, 'newAuthorsRead', 'weekly'),
  def('c1', 'comment', 'chatbubble-ellipses-outline', 5, 90, 'commentsPosted', 'weekly'),
  def('c2', 'comment', 'person-add-outline', 3, 60, 'newFollows', 'weekly'),
  def('c3', 'comment', 'heart-outline', 10, 40, 'storiesLiked', 'weekly'),
  def('c4', 'comment', 'ribbon-outline', 1, 180, 'firstComments', 'once', true),
];

/**
 * Hafta sonu maratonu: yalnızca Cuma–Pazar (yerel) arası yapılan aksiyonlar
 * sayılır. Parçalar ayrı ilerler; ikisi de dolunca tek ödül alınır.
 */
export const WEEKEND_CHALLENGE = {
  id: 'wk',
  title: 'challenges.weekly.title',
  desc: 'challenges.weekly.desc',
  xp: 250,
  parts: [
    { id: 'wkr', tracker: 'chaptersRead' as Tracker, goal: 3 },
    { id: 'wkc', tracker: 'commentsPosted' as Tracker, goal: 2 },
  ],
};

export const WEEKEND_GOAL = WEEKEND_CHALLENGE.parts.reduce((total, part) => total + part.goal, 0);

/** Kural ve talep kontrolleri için: haftalık sıfırlanan ödül kimlikleri. */
export const WEEKLY_CLAIM_IDS = [
  ...CHALLENGE_DEFS.filter(item => item.repeat === 'weekly').map(item => item.id),
  WEEKEND_CHALLENGE.id,
];
export const ONCE_CLAIM_IDS = CHALLENGE_DEFS.filter(item => item.repeat === 'once').map(item => item.id);
/** Tek talebin verebileceği en yüksek XP (kural sınırı). */
export const MAX_CLAIM_XP = Math.max(WEEKEND_CHALLENGE.xp, ...CHALLENGE_DEFS.map(item => item.xp));

export const PILLAR_COLORS: Record<Pillar, string> = {
  write: '#DE5B88',
  read: '#7057D9',
  comment: '#2FA98A',
};

/** XP'nin karşılık geldiği rütbe sırası. */
export const getRankIndex = (xp: number): number =>
  RANKS.reduce((best, rank, index) => (xp >= rank.min ? index : best), 0);

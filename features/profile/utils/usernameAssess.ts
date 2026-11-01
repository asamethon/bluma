import { USERNAME_MAX_LENGTH, normalizeUsername } from '@/features/auth/utils/usernameNormalize';

/**
 * Bir kullanıcı adının "daha iyisini önermeye değer" olup olmadığını söyler.
 *
 * İlke: YANLIŞ POZİTİF, KAÇIRMAKTAN KÖTÜDÜR. Gerçek adını kullanan birine
 * "adını değiştir" demek, gürültülü bir adı kaçırmaktan daha rahatsız edici.
 * Şüphede kalınan her durumda işaretlemiyoruz.
 */
export type UsernameFlagReason = 'mangled' | 'mixed' | 'digits' | 'noVowels' | 'keyboard';
export type UsernameAssessment = { flagged: boolean; reason?: UsernameFlagReason };

const CLEAN: UsernameAssessment = { flagged: false };

/** Sesli harfler — `y` de sesli sayılır, yoksa "krzysztof" gürültü sanılır. */
const VOWELS = 'aeiouy';

/**
 * Klavye HARF sıraları (TR Q düzeni dahil); ters yönleri de taranır.
 * Rakam sırası bilinçli olarak yok: "12345" gibi diziler `digits` kuralına
 * düşsün, yoksa "okur12345" klavye gürültüsü sanılıp yanlış gerekçe alıyor.
 */
const KEYBOARD_ROWS = ['qwertyuiopgu', 'asdfghjklsi', 'zxcvbnmoc'];
const KEYBOARD_RUN = 5;

/** Düzeltmeden ÖNCEki hatalı filtre — "Özgür" → "zgr" üreten kod buydu. */
const legacyUsername = (raw: string) => raw.toLowerCase().replace(/[^a-z0-9_]/g, '');

const firstWordOf = (displayName: string) => displayName.trim().split(/\s+/)[0] ?? '';

/**
 * En güvenilir sinyal: kullanıcı adı, görünen adın ESKİ silme filtresinden
 * geçmiş hâline eşit. Yani bu adı kullanıcı seçmedi — biz bozduk.
 */
function isMangled(username: string, displayName: string): boolean {
  const normalized = normalizeUsername(displayName);
  if (!normalized || normalized === username) return false;
  return [displayName, firstWordOf(displayName)].some(source => {
    const legacy = legacyUsername(source);
    return !!legacy && (legacy === username || legacy.slice(0, USERNAME_MAX_LENGTH) === username);
  });
}

/**
 * Kullanıcı adı zaten kişinin kendi adı (alt çizgi farkı sayılmaz).
 * "li_wei", "yuki_tanaka" gibi adlar bu yüzden asla işaretlenmez.
 */
function isOwnName(username: string, displayName: string): boolean {
  const compact = username.replace(/_/g, '');
  if (compact.length < 2) return false;
  const normalized = normalizeUsername(displayName);
  if (!/[a-z]{2}/.test(normalized)) return false;
  return compact === normalized || compact === normalizeUsername(firstWordOf(displayName));
}

/** "qwerty", "asdfgh", "zxcvbn" — klavyeden sırayla okunmuş diziler. */
function hasKeyboardRun(value: string): boolean {
  for (const row of KEYBOARD_ROWS) {
    const reversed = Array.from(row).reverse().join('');
    for (let index = 0; index + KEYBOARD_RUN <= value.length; index++) {
      const slice = value.slice(index, index + KEYBOARD_RUN);
      if (row.includes(slice) || reversed.includes(slice)) return true;
    }
  }
  return false;
}

/** "aaaa" ya da "asdasd" — tek karakter ya da kısa bir öbeğin tekrarı. */
function isRepeated(value: string): boolean {
  if (/^(.)\1+$/.test(value)) return true;
  // 6 karakter sınırı bilinçli: "lili", "coco" gibi gerçek takma adlar kalsın.
  if (value.length < 6) return false;
  for (const unit of [2, 3]) {
    if (value.length % unit) continue;
    const head = value.slice(0, unit);
    if (head.repeat(value.length / unit) === value) return true;
  }
  return false;
}

/** Harf↔rakam geçiş sayısı; alt çizgi sayılmaz ("elif_35" tek geçiş). */
function letterDigitTransitions(value: string): number {
  const classes = Array.from(value)
    .filter(char => /[a-z0-9]/.test(char))
    .map(char => (/[0-9]/.test(char) ? 'd' : 'l'));
  return classes.reduce((count, char, index) => (index && char !== classes[index - 1] ? count + 1 : count), 0);
}

/** 5+ ardışık rakam ya da rakam oranı yarıdan fazla. */
function isDigitHeavy(value: string): boolean {
  if (/\d{5,}/.test(value)) return true;
  return (value.match(/\d/g)?.length ?? 0) / value.length > 0.5;
}

/** Harf öbeklerinden birinde 6+ karakterlik sessiz dizi. */
function hasVowellessRun(value: string): boolean {
  return value.split(/[^a-z]+/).some(segment => {
    let run = 0;
    for (const char of segment) {
      run = VOWELS.includes(char) ? 0 : run + 1;
      if (run >= 6) return true;
    }
    return false;
  });
}

/**
 * Sıra önemli: `mangled` en güvenilir sinyal olduğu için önce bakılır,
 * ardından "bu kişinin kendi adı" muafiyeti gelir — ondan sonraki kurallar
 * yalnızca gerçekten gürültülü adlara uygulanır.
 *
 * `displayName` verilmezse yalnızca gürültü kuralları çalışır; aday
 * kullanıcı adlarını süzerken bu biçimde (muafiyetsiz) çağrılır.
 */
export function assessUsername(username: string, displayName = ''): UsernameAssessment {
  const value = (username || '').trim().toLowerCase();
  if (!value) return CLEAN;
  if (displayName && isMangled(value, displayName)) return { flagged: true, reason: 'mangled' };
  if (value.length < 3) return CLEAN;
  if (displayName && isOwnName(value, displayName)) return CLEAN;
  if (hasKeyboardRun(value) || isRepeated(value)) return { flagged: true, reason: 'keyboard' };
  if (value.length >= 6 && letterDigitTransitions(value) >= 3) return { flagged: true, reason: 'mixed' };
  if (isDigitHeavy(value)) return { flagged: true, reason: 'digits' };
  if (hasVowellessRun(value)) return { flagged: true, reason: 'noVowels' };
  return CLEAN;
}

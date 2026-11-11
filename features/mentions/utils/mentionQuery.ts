/**
 * `@bahsetme` metin kuralları: yazı alanları (öneri listesi) ve bildirim
 * gönderimi aynı tanımı kullanır. Kullanıcı adı karakterleri
 * features/auth/utils/usernameNormalize ile uyumludur.
 */
const TRAILING_MENTION = /(?:^|\s)@([a-zA-Z0-9_]*)$/;
const MENTION = /@([a-zA-Z0-9_]+)/g;
const MAX_MENTIONS = 10;

/** Metnin sonunda yazılmakta olan etiket varsa sorgusunu döner (`@` tek başına → ''). */
export function activeMentionQuery(text: string): string | null {
  const match = text.match(TRAILING_MENTION);
  return match ? match[1] : null;
}

/** Yazılmakta olan `@sorgu`yu seçilen adla değiştirir; ardına boşluk koyar. */
export function insertMention(text: string, username: string): string {
  const match = text.match(TRAILING_MENTION);
  if (!match) return text;
  return `${text.slice(0, text.length - match[1].length - 1)}@${username} `;
}

/** Bildirim için etiketlenen tekil adlar (küçük harf, en fazla 10). */
export function extractMentions(text: string): string[] {
  const names = (text.match(MENTION) ?? []).map(item => item.slice(1).toLowerCase());
  return [...new Set(names)].slice(0, MAX_MENTIONS);
}

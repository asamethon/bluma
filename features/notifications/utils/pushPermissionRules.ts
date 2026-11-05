import type { PushPermission } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** İki yumuşak kart arasında en az bu kadar beklenir. */
export const PROMPT_COOLDOWN_MS = 3 * DAY_MS;
/** Kart en fazla bu kadar gösterilir; sonrasında yalnızca şerit kalır. */
export const PROMPT_MAX_SHOWS = 3;
/** Ana sayfa şeridi "Şimdi değil" denince bu kadar gizlenir. */
export const BANNER_SNOOZE_MS = 7 * DAY_MS;

export type PushPromptRecord = {
  shows: number;
  lastShownAt: number;
  bannerUntil: number;
};

export const EMPTY_PROMPT_RECORD: PushPromptRecord = { shows: 0, lastShownAt: 0, bannerUntil: 0 };

/** Okunamayan kayıt: hiçbir şey gösterilmez (ısrar etmek susmaktan kötü). */
export const SILENT_PROMPT_RECORD: PushPromptRecord = {
  shows: PROMPT_MAX_SHOWS,
  lastShownAt: Number.MAX_SAFE_INTEGER,
  bannerUntil: Number.MAX_SAFE_INTEGER,
};

/** iOS geçici izni (provisional) de bildirimi teslim eder. */
const IOS_PROVISIONAL = 3;

type PermissionSnapshot = {
  status: string;
  canAskAgain: boolean;
  ios?: { status?: number } | null;
};

export function toPushPermission(snapshot: PermissionSnapshot): PushPermission {
  if (snapshot.status === 'granted' || snapshot.ios?.status === IOS_PROVISIONAL) return 'granted';
  return snapshot.canAskAgain ? 'askable' : 'blocked';
}

const isOff = (permission: PushPermission | null) => permission === 'askable' || permission === 'blocked';

/** Değer anındaki kart: izin kapalı, sınır dolmadı, bekleme süresi geçti. */
export function canOfferPrompt(record: PushPromptRecord, permission: PushPermission | null, now: number) {
  if (!isOff(permission) || record.shows >= PROMPT_MAX_SHOWS) return false;
  return now - record.lastShownAt >= PROMPT_COOLDOWN_MS;
}

/** Şerit: izin kapalı ve kullanıcı yakın zamanda "Şimdi değil" demedi. */
export function canShowBanner(record: PushPromptRecord, permission: PushPermission | null, now: number) {
  return isOff(permission) && now >= record.bannerUntil;
}

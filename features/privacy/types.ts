import type { BoardPostPolicy, PrivacySettings } from '@/types';

export type { BoardPostPolicy, PrivacySettings };

/** Yalnızca açık/kapalı olan ayarlar — anahtar (Switch) satırları. */
export type PrivacyToggleKey = Exclude<keyof PrivacySettings, 'boardPosts'>;

export const DEFAULT_PRIVACY: PrivacySettings = {
  privateAccount: false,
  showActivity: true,
  allowMessages: true,
  discoverable: true,
  boardPosts: 'everyone',
};

// Eski hesaplarda `privacy` alanı yok; okuyan her yer varsayılanla doldurur.
type PrivacyCarrier = { privacy?: Partial<PrivacySettings> | null } | null | undefined;

export function privacyOf(subject: PrivacyCarrier): PrivacySettings {
  return { ...DEFAULT_PRIVACY, ...(subject?.privacy ?? {}) };
}

export const isPrivateAccount = (subject: PrivacyCarrier) => privacyOf(subject).privateAccount;

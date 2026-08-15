import type { PrivacySettings } from '@/types';

export type { PrivacySettings };

export const DEFAULT_PRIVACY: PrivacySettings = {
  privateAccount: false,
  showActivity: true,
  allowMessages: true,
  discoverable: true,
};

// Eski hesaplarda `privacy` alanı yok; okuyan her yer varsayılanla doldurur.
type PrivacyCarrier = { privacy?: Partial<PrivacySettings> | null } | null | undefined;

export function privacyOf(subject: PrivacyCarrier): PrivacySettings {
  return { ...DEFAULT_PRIVACY, ...(subject?.privacy ?? {}) };
}

export const isPrivateAccount = (subject: PrivacyCarrier) => privacyOf(subject).privateAccount;
export const isDiscoverable = (subject: PrivacyCarrier) => privacyOf(subject).discoverable;
export const allowsMessages = (subject: PrivacyCarrier) => privacyOf(subject).allowMessages;
export const showsActivity = (subject: PrivacyCarrier) => privacyOf(subject).showActivity;

/** Herkese açık profil belgelerinde bulunmaması gereken hesap alanları. */
export const PRIVATE_PROFILE_FIELDS = [
  'email', 'appleUserId', 'signupPlatform', 'signupOsVersion',
  'signupAppVersion', 'signupDeviceModel', 'signupLanguage', 'signupRegion',
] as const;

const privateFields = new Set<string>(PRIVATE_PROFILE_FIELDS);

export function publicProfileData(data: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    !privateFields.has(key) && value !== undefined));
}

export function privateProfileData(data: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    privateFields.has(key) && value !== undefined));
}

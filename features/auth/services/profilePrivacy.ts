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

/**
 * Profil kaydının SAHİBİ olduğu alanlar. Sayaçlar, görev durumu, gizlilik ve
 * zaman damgaları kendi servislerince (atomik) yazılır; profil kaydı onları
 * Redux'taki eski anlık görüntüden geri yazmaz. Aksi halde başka cihazda
 * değişen takipçi sayısı/gizlilik ayarı geri sarılıyor, önbellekten gelen
 * zaman damgası haritaya dönüşüyordu — ve güvenlik kuralı yazımı reddediyor.
 */
const PROFILE_WRITE_FIELDS = new Set([
  'id', 'displayName', 'username', 'bio', 'interests', 'intent',
  'website', 'location', 'profileImage', 'coverImage', 'authProvider',
]);

export function profileWriteData(data: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    PROFILE_WRITE_FIELDS.has(key) && value !== undefined));
}

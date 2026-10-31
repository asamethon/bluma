import { PRIVATE_PROFILE_FIELDS, privateProfileData, profileWriteData, publicProfileData } from '@/features/auth/services/profilePrivacy';
import { sessionUser } from '@/features/auth/services/sessionIdentity';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node taşıma betiği CJS olarak çalışır.
const { PRIVATE_FIELDS } = require('../scripts/migratePrivateProfiles.cjs');
const legacy = {
  id: 'writer', displayName: 'Yazar', username: 'yazar', interests: ['fantastik'],
  email: 'private@example.com', appleUserId: 'apple-secret',
  signupPlatform: 'ios', signupOsVersion: '26', signupAppVersion: '3',
  signupDeviceModel: 'phone', signupLanguage: 'tr', signupRegion: 'TR',
};

describe('profil gizliliği', () => {
  it('taşıma betiği tüm özel alanları kapsar', () => {
    expect(PRIVATE_FIELDS).toEqual([...PRIVATE_PROFILE_FIELDS]);
  });

  it('eski oturum nesnesi yeniden kaydedilse bile özel veriler yayımlanmaz', () => {
    const publicData = publicProfileData({ ...legacy, bio: undefined });
    expect(publicData).toEqual({ id: 'writer', displayName: 'Yazar', username: 'yazar', interests: ['fantastik'] });
    expect(privateProfileData(legacy)).toEqual(Object.fromEntries(PRIVATE_PROFILE_FIELDS.map(key => [key, legacy[key]])));
    expect(legacy.email).toBe('private@example.com');
  });

  it('profilde e-posta olmasa da oturum Auth adresini ve sağlayıcısını korur', () => {
    const firebaseUser = {
      uid: 'writer', email: 'current@example.com', displayName: 'Auth adı',
      providerData: [{ providerId: 'google.com' }],
    } as FirebaseAuthTypes.User;
    const user = sessionUser(firebaseUser, legacy);
    expect(user).toMatchObject({ id: 'writer', email: 'current@example.com', displayName: 'Yazar', authProvider: 'google', username: 'yazar' });
    // Profil düzenlenirse eski bağlam da kaybolmadan özel belgeye taşınır.
    expect(privateProfileData(user)).toMatchObject({ email: 'current@example.com', signupDeviceModel: 'phone', appleUserId: 'apple-secret' });
    expect(publicProfileData(user)).not.toHaveProperty('email');
  });

  it('profil kaydı sayaçları, görev durumunu, gizliliği ve zaman damgalarını geri yazmaz', () => {
    // Redux'taki kullanıcı, belge okunduğu andaki sayaçları ve önbellekten
    // dönen (haritaya dönüşmüş) zaman damgalarını taşır.
    const stale = {
      ...legacy, bio: 'Yeni biyografi', website: 'https://ornek.com', coverImage: null,
      followersCount: 3, followingCount: 1, storiesCount: 2, xp: 900, streak: 4,
      claimedChallenges: ['w1'], challengeProgress: { w1: 3 }, privacy: { privateAccount: true },
      createdAt: { seconds: 1, nanoseconds: 0 }, lastActiveAt: 5,
    };
    expect(profileWriteData(stale)).toEqual({
      id: 'writer', displayName: 'Yazar', username: 'yazar', interests: ['fantastik'],
      bio: 'Yeni biyografi', website: 'https://ornek.com', coverImage: null,
    });
  });

  it('ad eksikse e-postanın yerel kısmından görünen ad türetmez', () => {
    const user = sessionUser({ uid: 'u', email: 'secret@example.com', providerData: [] } as unknown as FirebaseAuthTypes.User, {});
    expect(user.email).toBe('secret@example.com');
    expect(user.displayName).not.toContain('secret');
  });
});

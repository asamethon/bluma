import type { User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { saveUserProfile } from './profileRepository';
import { privateProfileData } from './profilePrivacy';
import { readCachedSession } from './sessionStorage';
import { buildSignupContext, trackSignupContext } from './signupContext';

export type ProviderIdentity = {
  email: string;
  displayName: string;
  authProvider: User['authProvider'];
  appleUserId?: string;
};

/** Profil okuma ile kimlik güncelleme hataları birbirinden bağımsızdır. */
export async function upsertProviderProfile(
  userId: string,
  identity: ProviderIdentity,
): Promise<{ user: User; isNew: boolean }> {
  const snapshot = await getDoc(doc(getFirestore(), 'users', userId)).catch(error => {
    logger.debug('Profil okunamadı; oturum önbelleği kontrol ediliyor:', error);
    return null;
  });
  if (!snapshot) {
    const cached = await readCachedSession();
    const profile = cached?.user.id === userId ? cached.user : {};
    return { user: { ...profile, id: userId, ...identity } as User, isNew: false };
  }

  const existing = snapshot.data();
  if (!existing) {
    const signupContext = buildSignupContext();
    const user = { id: userId, ...identity, ...signupContext } as User;
    // Oluşturulamayan profil başarılı kayıt gibi gösterilmez.
    await saveUserProfile(user, true);
    trackSignupContext(signupContext);
    return { user, isNew: true };
  }

  // Uygulamada seçilen görünen ad korunur: Apple adı yalnızca ilk girişte verir,
  // sonraki girişlerde gelen yedek ad ("Apple Kullanıcısı") profili ezmemeli.
  const merged = { ...identity, displayName: existing.displayName || identity.displayName };
  const user = { ...existing, id: userId, ...merged } as User;
  try {
    // Sayaçları eski anlık görüntüyle ezmeden yalnızca kimlik ve eski özel alanları taşır.
    await saveUserProfile({ ...privateProfileData(existing), id: userId, ...merged });
  } catch (error) {
    logger.warn('Profil kimlik alanları güncellenemedi; okunan profil korunuyor:', error);
  }
  return { user, isNew: false };
}

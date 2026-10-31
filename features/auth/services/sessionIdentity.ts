import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { User } from '@/store/slices/authSlice';
import i18n from '@/i18n';
import { privateProfileData, publicProfileData } from './profilePrivacy';

/** E-posta için tek doğru kaynak Auth'tur; herkese açık profil onu içermez. */
export function sessionUser(firebaseUser: FirebaseAuthTypes.User, profile: object): User {
  // Eski profil/önbellekteki bağlam, özel belgeye taşınana kadar kendi oturumunda korunur.
  const data = { ...publicProfileData(profile), ...privateProfileData(profile) };
  const providerId = firebaseUser.providerData[0]?.providerId ?? '';
  const authProvider = providerId.includes('apple') ? 'apple' : providerId.includes('google') ? 'google' : 'email';
  return {
    ...data,
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: data.displayName || firebaseUser.displayName || i18n.t('common.user'),
    authProvider,
  } as User;
}

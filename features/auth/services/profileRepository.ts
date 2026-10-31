import type { User } from '@/store/slices/authSlice';
import { deleteField, doc, getFirestore, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';
import { PRIVATE_PROFILE_FIELDS, privateProfileData, profileWriteData } from './profilePrivacy';

/** Özel alanların eski profil önbelleklerinden tekrar yayımlanmasını da önler. */
export async function saveUserProfile(user: Pick<User, 'id'> & Partial<User>, isNew = false) {
  const db = getFirestore();
  const batch = writeBatch(db);
  const removedFields = Object.fromEntries(PRIVATE_PROFILE_FIELDS.map(key => [key, deleteField()]));
  batch.set(doc(db, 'users', user.id), {
    ...profileWriteData(user),
    ...removedFields,
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  const privateData = privateProfileData(user);
  if (Object.keys(privateData).length) {
    batch.set(doc(db, 'users', user.id, 'private', 'account'), privateData, { merge: true });
  }
  await batch.commit();
}

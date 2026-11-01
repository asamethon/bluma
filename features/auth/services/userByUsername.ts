import { collection, getDocs, getFirestore, limit, query, where } from '@react-native-firebase/firestore';
import { normalizeUsername } from '@/features/auth/utils/usernameNormalize';
import { User } from '@/store/slices/authSlice';
import { publicProfileData } from './profilePrivacy';

/**
 * `@bahsetme`yi kullanıcıya çözer. Güncel adda eşleşme yoksa eski adlara
 * bakılır, böylece adını değiştiren birine atılmış eski etiketler kırılmaz.
 * İkinci sorgu yalnızca gerektiğinde atılır.
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const normalized = normalizeUsername(username);
    if (!normalized) return null;
    const users = collection(getFirestore(), 'users');
    const current = await getDocs(query(users, where('username', '==', normalized), limit(1)));
    const docSnap = current.docs[0] ?? (await getDocs(
      query(users, where('previousUsernames', 'array-contains', normalized), limit(1)),
    )).docs[0];
    if (!docSnap) return null;
    return { id: docSnap.id, ...(publicProfileData(docSnap.data()!) as any) } as User;
  } catch {
    return null;
  }
}

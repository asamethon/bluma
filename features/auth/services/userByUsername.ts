import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { User } from '@/store/slices/authSlice';
import { publicProfileData } from './profilePrivacy';

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const normalized = username.toLowerCase().trim();
    if (!normalized) return null;
    const db = getFirestore();
    const snapshot = await getDocs(query(collection(db, 'users'), where('username', '==', normalized)));
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...(publicProfileData(docSnap.data()!) as any) } as User;
  } catch {
    return null;
  }
}

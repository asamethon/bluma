import {
  doc,
  getDoc,
  getFirestore,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { getUserById } from '@/features/auth/services/userCache';
import { logger } from '@/utils/logger';
import { privacyOf } from '../../types';

const db = () => getFirestore();

export async function isFollowerOf(ownerId: string, viewerId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db(), 'users', ownerId, 'followers', viewerId));
    return snap.exists();
  } catch (error) {
    logger.error('Takipçi kontrolü başarısız:', error);
    return false;
  }
}

/** Gizli hesabın profili/içerikleri yalnızca takipçilerine (ve sahibine) açıktır. */

export async function canViewProfile(targetUserId: string): Promise<boolean> {
  const myId = store.getState().auth.user?.id;
  if (!targetUserId) return false;
  if (targetUserId === myId) return true;

  const target = await getUserById(targetUserId);
  if (!privacyOf(target).privateAccount) return true;
  if (!myId) return false;
  return isFollowerOf(targetUserId, myId);
}

/**
 * Alıcı "herkes mesaj gönderebilsin"i kapattıysa yalnızca KENDİ takip ettiği
 * kişiler yazabilir (kurallarda da aynısı zorlanır).
 */

export async function canSendMessageTo(targetUserId: string): Promise<boolean> {
  const myId = store.getState().auth.user?.id;
  if (!myId || !targetUserId) return false;
  if (myId === targetUserId) return true;

  const target = await getUserById(targetUserId);
  if (privacyOf(target).allowMessages) return true;

  try {
    const snap = await getDoc(doc(db(), 'users', targetUserId, 'following', myId));
    return snap.exists();
  } catch (error) {
    logger.error('Mesaj izni kontrolü başarısız:', error);
    return false;
  }
}

/** "Aramada göster" kapalı hesaplar arama/öneri listelerinden düşer. */

export function filterDiscoverable<T extends { id: string; privacy?: any }>(users: T[]): T[] {
  const myId = store.getState().auth.user?.id;
  return users.filter(u => u.id === myId || privacyOf(u).discoverable);
}

/** Gizli hesapların içeriği, takipçi olmayanların akış/arama listelerinden düşer. */

export function filterPrivateContent<T extends { authorId?: string; author?: any }>(
  items: T[],
  followingIds?: string[]
): T[] {
  const state = store.getState();
  const myId = state.auth.user?.id;
  const following = followingIds ?? state.privacy.followingIds;
  return items.filter(item => {
    const authorId = item.authorId ?? item.author?.id;
    if (!authorId || authorId === myId) return true;
    if (!privacyOf(item.author).privateAccount) return true;
    return following.includes(authorId);
  });
}

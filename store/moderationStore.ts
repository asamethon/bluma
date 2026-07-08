import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { store } from './index';
import { addBlockedUser, patchModeration, removeBlockedUser } from './slices/moderationSlice';

export type { ModerationState } from './slices/moderationSlice';

export type ReportTargetType = 'story' | 'comment' | 'user' | 'conversation';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'sexual'
  | 'violence'
  | 'self_harm'
  | 'misinformation'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam veya yanıltıcı' },
  { value: 'harassment', label: 'Taciz veya zorbalık' },
  { value: 'hate', label: 'Nefret söylemi' },
  { value: 'sexual', label: 'Cinsel/uygunsuz içerik' },
  { value: 'violence', label: 'Şiddet veya tehdit' },
  { value: 'self_harm', label: 'Kendine zarar' },
  { value: 'misinformation', label: 'Yanlış bilgi' },
  { value: 'other', label: 'Diğer' },
];

export const moderationActions = {
  // Engellenen kullanıcıları yükle (giriş yapan kullanıcı için)
  async loadBlockedUsers() {
    const { user } = store.getState().auth;
    if (!user?.id) {
      store.dispatch(patchModeration({ blockedUserIds: [], loaded: true }));
      return;
    }
    try {
      const db = getFirestore();
      const snap = await getDocs(collection(db, 'users', user.id, 'blocked'));
      store.dispatch(patchModeration({ blockedUserIds: snap.docs.map(d => d.id) }));
    } catch (error) {
      console.error('Load blocked users error:', error);
    } finally {
      store.dispatch(patchModeration({ loaded: true }));
    }
  },

  isBlocked(userId?: string | null): boolean {
    if (!userId) return false;
    return store.getState().moderation.blockedUserIds.includes(userId);
  },

  // Bir kullanıcı listesini/akışını engellenenlerden arındır
  filterBlocked<T extends { authorId?: string; userId?: string }>(items: T[]): T[] {
    const blocked = store.getState().moderation.blockedUserIds;
    if (blocked.length === 0) return items;
    return items.filter(it => {
      const owner = (it.authorId ?? it.userId) as string | undefined;
      return !owner || !blocked.includes(owner);
    });
  },

  // Şikayet üzerine admin'in gizlediği içerikleri akıştan çıkar — yazarın
  // kendisi kendi taslak/gizli hikâyesini stüdyosunda görmeye devam eder,
  // bu filtre yalnızca genel akışlar (feed/discover/search) için (bkz. 2.7).
  filterHidden<T extends { isHidden?: boolean }>(items: T[]): T[] {
    return items.filter(it => !it.isHidden);
  },

  async blockUser(userId: string) {
    const { user } = store.getState().auth;
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    if (userId === user.id) return { success: false, error: 'Kendini engelleyemezsin.' };
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.id, 'blocked', userId), {
        createdAt: serverTimestamp(),
      });
      store.dispatch(addBlockedUser(userId));
      return { success: true };
    } catch (error) {
      console.error('Block user error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Engelleme başarısız.' };
    }
  },

  async unblockUser(userId: string) {
    const { user } = store.getState().auth;
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'users', user.id, 'blocked', userId));
      store.dispatch(removeBlockedUser(userId));
      return { success: true };
    } catch (error) {
      console.error('Unblock user error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Engel kaldırılamadı.' };
    }
  },

  // İçerik bildir — moderasyon ekibinin inceleyebileceği `reports` koleksiyonu
  async reportContent(params: {
    type: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
    reportedUserId?: string;
    contextId?: string; // ör. yorum için storyId
  }) {
    const { user } = store.getState().auth;
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'reports'), {
        reporterId: user.id,
        type: params.type,
        targetId: params.targetId,
        reportedUserId: params.reportedUserId || null,
        contextId: params.contextId || null,
        reason: params.reason,
        details: params.details || '',
        status: 'open',
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Report content error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Bildirim gönderilemedi.' };
    }
  },
};

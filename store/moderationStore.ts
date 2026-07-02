import { observable } from '@legendapp/state';
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
import { authState$ } from './authStore';

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

export interface ModerationState {
  blockedUserIds: string[];
  loaded: boolean;
}

export const moderationState$ = observable<ModerationState>({
  blockedUserIds: [],
  loaded: false,
});

export const moderationActions = {
  // Engellenen kullanıcıları yükle (giriş yapan kullanıcı için)
  async loadBlockedUsers() {
    const { user } = authState$.get();
    if (!user?.id) {
      moderationState$.blockedUserIds.set([]);
      moderationState$.loaded.set(true);
      return;
    }
    try {
      const db = getFirestore();
      const snap = await getDocs(collection(db, 'users', user.id, 'blocked'));
      moderationState$.blockedUserIds.set(snap.docs.map(d => d.id));
    } catch (error) {
      console.error('Load blocked users error:', error);
    } finally {
      moderationState$.loaded.set(true);
    }
  },

  isBlocked(userId?: string | null): boolean {
    if (!userId) return false;
    return moderationState$.blockedUserIds.get().includes(userId);
  },

  // Bir kullanıcı listesini/akışını engellenenlerden arındır
  filterBlocked<T extends { authorId?: string; userId?: string }>(items: T[]): T[] {
    const blocked = moderationState$.blockedUserIds.get();
    if (blocked.length === 0) return items;
    return items.filter(it => {
      const owner = (it.authorId ?? it.userId) as string | undefined;
      return !owner || !blocked.includes(owner);
    });
  },

  async blockUser(userId: string) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    if (userId === user.id) return { success: false, error: 'Kendini engelleyemezsin.' };
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.id, 'blocked', userId), {
        createdAt: serverTimestamp(),
      });
      moderationState$.blockedUserIds.set(prev =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
      return { success: true };
    } catch (error) {
      console.error('Block user error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Engelleme başarısız.' };
    }
  },

  async unblockUser(userId: string) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'users', user.id, 'blocked', userId));
      moderationState$.blockedUserIds.set(prev => prev.filter(id => id !== userId));
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
    const { user } = authState$.get();
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

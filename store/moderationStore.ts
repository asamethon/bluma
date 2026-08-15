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
import i18n from '@/i18n';
import { store } from './index';
import { addBlockedUser, patchModeration, removeBlockedUser } from './slices/moderationSlice';
import { logger } from '@/utils/logger';

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
  { value: 'spam', label: 'report.reasons.spam' },
  { value: 'harassment', label: 'report.reasons.harassment' },
  { value: 'hate', label: 'report.reasons.hate' },
  { value: 'sexual', label: 'report.reasons.sexual' },
  { value: 'violence', label: 'report.reasons.violence' },
  { value: 'self_harm', label: 'report.reasons.self_harm' },
  { value: 'misinformation', label: 'report.reasons.misinformation' },
  { value: 'other', label: 'report.reasons.other' },
];

export const moderationActions = {
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
      logger.error('Load blocked users error:', error);
    } finally {
      store.dispatch(patchModeration({ loaded: true }));
    }
  },

  isBlocked(userId?: string | null): boolean {
    if (!userId) return false;
    return store.getState().moderation.blockedUserIds.includes(userId);
  },

  filterBlocked<T extends { authorId?: string; userId?: string }>(
    items: T[],
    blockedUserIds?: string[]
  ): T[] {
    const blocked = blockedUserIds ?? store.getState().moderation.blockedUserIds;
    if (blocked.length === 0) return items;
    return items.filter(it => {
      const owner = (it.authorId ?? it.userId) as string | undefined;
      return !owner || !blocked.includes(owner);
    });
  },

  filterHidden<T extends { isHidden?: boolean }>(items: T[]): T[] {
    return items.filter(it => !it.isHidden);
  },

  async blockUser(userId: string) {
    const { user } = store.getState().auth;
    if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
    if (userId === user.id) return { success: false, error: i18n.t('moderation.cannotBlockSelf') };
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.id, 'blocked', userId), {
        createdAt: serverTimestamp(),
      });
      store.dispatch(addBlockedUser(userId));
      return { success: true };
    } catch (error) {
      logger.error('Block user error:', error);
      return { success: false, error: error instanceof Error ? error.message : i18n.t('moderation.blockFailed') };
    }
  },

  async unblockUser(userId: string) {
    const { user } = store.getState().auth;
    if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'users', user.id, 'blocked', userId));
      store.dispatch(removeBlockedUser(userId));
      return { success: true };
    } catch (error) {
      logger.error('Unblock user error:', error);
      return { success: false, error: error instanceof Error ? error.message : i18n.t('moderation.unblockFailed') };
    }
  },

  async reportContent(params: {
    type: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
    reportedUserId?: string;
    contextId?: string;
  }) {
    const { user } = store.getState().auth;
    if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
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
      logger.error('Report content error:', error);
      return { success: false, error: error instanceof Error ? error.message : i18n.t('report.submitFailed') };
    }
  },
};

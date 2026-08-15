import { Notification, NotificationSettings } from '@/types';
import {
  collection,
  deleteDoc,
  doc,
  query as firestoreQuery,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from './index';
import { patchNotification } from './slices/notificationSlice';
import { logger } from '@/utils/logger';

export type { NotificationState } from './slices/notificationSlice';

let notificationsUnsub: (() => void) | null = null;
let notificationsUserId: string | null = null;
// Zenginleştirme asenkron: eski bir snapshot'ın sonucu yenisini ezmesin.
let notificationsRevision = 0;

/**
 * Gönderen bilgisini (ad + avatar) dokümanda saklamak yerine okurken çözer:
 * avatarın güncel kalmasını sağlar ve tarifi olmayan ESKİ bildirimlerin
 * metnini okuyanın dilinde yeniden kurabilmek için ad bilgisini verir.
 */
async function withSenderInfo(notifications: Notification[]): Promise<Notification[]> {
  const { getUserById } = await import('@/features/auth/services/userCache');
  const senderIds = Array.from(new Set(notifications.map(n => n.senderId).filter(Boolean)));
  const entries = await Promise.all(
    senderIds.map(async id => [id, await getUserById(id).catch(() => null)] as const)
  );
  const senders = new Map(entries);

  return notifications.map(n => {
    const sender = senders.get(n.senderId);
    if (!sender) return n;
    return {
      ...n,
      senderName: sender.displayName || sender.username,
      senderAvatar: sender.profileImage,
    };
  });
}

export const notificationActions = {
  async initializeNotifications(userId: string) {
    try {
      if (notificationsUnsub && notificationsUserId === userId) return notificationsUnsub;
      if (notificationsUnsub) notificationsUnsub();
      notificationsUserId = userId;

      store.dispatch(patchNotification({ isLoading: true }));

      const db = getFirestore();
      const notificationsRef = collection(db, 'notifications');

      const q = firestoreQuery(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      notificationsUnsub = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = [];
        let unreadCount = 0;

        if (snapshot && !snapshot.empty) {
          snapshot.forEach((doc: any) => {
            const notification = { id: doc.id, ...doc.data() } as Notification;
            notifications.push(notification);
            if (!notification.isRead) {
              unreadCount++;
            }
          });
        }

        // Önce ham liste (anında çizim), ardından gönderen bilgisiyle tazelenir.
        const revision = ++notificationsRevision;
        store.dispatch(patchNotification({ notifications, unreadCount }));
        withSenderInfo(notifications)
          .then(enriched => {
            if (revision !== notificationsRevision) return;
            store.dispatch(patchNotification({ notifications: enriched }));
          })
          .catch(() => {});
      }, (error) => {
        logger.error('Firestore snapshot error:', error);
      });

      await notificationActions.loadNotificationSettings(userId);

      store.dispatch(patchNotification({ isLoading: false }));

      return notificationsUnsub;
    } catch (error) {
      logger.error('Initialize notifications error:', error);
      store.dispatch(patchNotification({ isLoading: false }));
    }
  },

  cleanupNotificationsListener() {
    if (notificationsUnsub) notificationsUnsub();
    notificationsUnsub = null;
    notificationsUserId = null;
  },

  async loadNotificationSettings(userId: string) {
    try {
      const db = getFirestore();
      const settingsRef = doc(db, 'notificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        store.dispatch(patchNotification({ settings: settingsDoc.data() as NotificationSettings }));
      } else {
        const defaultSettings: NotificationSettings = {
          userId,
          followNotifications: true,
          likeNotifications: true,
          commentNotifications: true,
          mentionNotifications: true,
          storyNotifications: true,
          emailNotifications: false,
          pushNotifications: true,
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(settingsRef, defaultSettings);
        store.dispatch(patchNotification({ settings: defaultSettings }));
      }
    } catch (error) {
      logger.error('Load notification settings error:', error);
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, 'notifications', notificationId);
      
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const db = getFirestore();
      const notificationsRef = collection(db, 'notifications');
      const q = firestoreQuery(
        notificationsRef,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach((doc: any) => {
        batch.update(doc.ref, {
          isRead: true,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
    } catch (error) {
      logger.error('Mark all as read error:', error);
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      logger.error('Delete notification error:', error);
    }
  },

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const db = getFirestore();
      const notificationsRef = collection(db, 'notifications');
      
      const cleanNotification = Object.fromEntries(
        Object.entries(notification).filter(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            return false;
          }
          if (Array.isArray(value) && value.length === 0) {
            return false;
          }
          return true;
        })
      );
      
      const newNotification = {
        ...cleanNotification,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(notificationsRef), newNotification);
    } catch (error) {
      logger.error('Create notification error:', error);
    }
  },

  async announceStoryToFollowers(
    authorId: string,
    authorName: string,
    storyId: string,
    storyTitle: string,
    kind: 'new_story' | 'new_chapter',
    chapterNumber?: number
  ) {
    try {
      const db = getFirestore();
      const followersSnapshot = await getDocs(collection(db, 'users', authorId, 'followers'));
      if (followersSnapshot.empty) return;

      // Metin alıcının cihazında üretilsin diye tarif de dokümana yazılır.
      const titleKey = kind === 'new_story'
        ? 'notifications.newStoryTitle'
        : 'notifications.newChapterTitle';
      const messageKey = kind === 'new_story'
        ? 'notifications.newStoryMessage'
        : chapterNumber
          ? 'notifications.newChapterMessageNumbered'
          : 'notifications.newChapterMessage';
      const params = {
        author: authorName,
        story: storyTitle,
        ...(chapterNumber ? { chapter: chapterNumber } : {}),
      };
      const title = i18n.t(titleKey);
      const message = i18n.t(messageKey, params);

      await Promise.all(
        followersSnapshot.docs.map(async (followerDoc: any) => {
          const followerId = followerDoc.id;
          if (!followerId || followerId === authorId) return;
          try {
            await notificationActions.createNotification({
              userId: followerId,
              senderId: authorId,
              type: kind === 'new_story' ? 'story_published' : 'new_chapter',
              title,
              message,
              data: {
                storyId,
                storyTitle,
                ...(chapterNumber ? { chapterNumber } : {}),
                i18n: { titleKey, messageKey, params },
              } as any,
              isRead: false,
            });
          } catch (error) {
            logger.error('Announce to follower error:', followerId, error);
          }
        })
      );
    } catch (error) {
      logger.error('Announce story to followers error:', error);
    }
  },

  // Gizli hesaba takip isteği: hedef kullanıcı onay/ret için bilgilendirilir.
  async createFollowRequestNotification(requesterId: string, targetUserId: string, requesterName: string) {
    return notificationActions.createFollowStyleNotification({
      senderId: requesterId,
      recipientId: targetUserId,
      type: 'follow_request',
      titleKey: 'notifications.followRequestTitle',
      messageKey: 'notifications.followRequestMessage',
      params: { name: requesterName },
    });
  },

  // İstek onaylandığında isteği gönderene geri bildirim.
  async createFollowAcceptedNotification(ownerId: string, requesterId: string, ownerName: string) {
    return notificationActions.createFollowStyleNotification({
      senderId: ownerId,
      recipientId: requesterId,
      type: 'follow_accepted',
      titleKey: 'notifications.followAcceptedTitle',
      messageKey: 'notifications.followAcceptedMessage',
      params: { name: ownerName },
    });
  },

  async createFollowStyleNotification(input: {
    senderId: string;
    recipientId: string;
    type: 'follow_request' | 'follow_accepted';
    titleKey: string;
    messageKey: string;
    params: Record<string, string | number>;
  }) {
    try {
      let senderProfileImage = null;
      try {
        const senderDoc = await getDoc(doc(getFirestore(), 'users', input.senderId));
        if (senderDoc.exists()) senderProfileImage = senderDoc.data()?.profileImage;
      } catch (error) {
        logger.debug('Error getting sender profile image:', error);
      }

      await notificationActions.createNotification({
        userId: input.recipientId,
        senderId: input.senderId,
        type: input.type,
        title: i18n.t(input.titleKey),
        message: i18n.t(input.messageKey, input.params),
        data: {
          followerId: input.senderId,
          ...(senderProfileImage ? { followerProfileImage: senderProfileImage } : {}),
          i18n: { titleKey: input.titleKey, messageKey: input.messageKey, params: input.params },
        },
        isRead: false,
      });
    } catch (error) {
      logger.error('Create follow-style notification error:', error);
    }
  },

  async createFollowNotification(followerId: string, followedUserId: string, followerName: string) {
    try {
      let followerProfileImage = null;
      try {
        const followerDoc = await getDoc(doc(getFirestore(), 'users', followerId));
        if (followerDoc.exists()) {
          followerProfileImage = followerDoc.data()?.profileImage;
        }
      } catch (error) {
        logger.debug('Error getting follower profile image:', error);
      }

      const notificationData: any = {
        followerId,
        i18n: {
          titleKey: 'notifications.newFollowerTitle',
          messageKey: 'notifications.newFollowerMessage',
          params: { name: followerName },
        },
      };

      if (followerProfileImage) {
        notificationData.followerProfileImage = followerProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: followedUserId,
        senderId: followerId,
        type: 'follow',
        title: i18n.t('notifications.newFollowerTitle'),
        message: i18n.t('notifications.newFollowerMessage', { name: followerName }),
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      logger.error('Create follow notification error:', error);
    }
  },

  async createLikeNotification(likerId: string, storyOwnerId: string, likerName: string, storyTitle: string, storyId: string, isConversation: boolean = false) {
    try {
      let likerProfileImage = null;
      try {
        const likerDoc = await getDoc(doc(getFirestore(), 'users', likerId));
        if (likerDoc.exists()) {
          likerProfileImage = likerDoc.data()?.profileImage;
        }
      } catch (error) {
        logger.debug('Error getting liker profile image:', error);
      }

      const notificationData: any = {
        storyId,
        storyTitle,
        i18n: {
          titleKey: 'notifications.newLikeTitle',
          messageKey: isConversation
            ? 'notifications.conversationLikedMessage'
            : 'notifications.storyLikedMessage',
          params: isConversation
            ? { name: likerName, conversation: storyTitle }
            : { name: likerName, story: storyTitle },
        },
      };

      if (likerProfileImage) {
        notificationData.likerProfileImage = likerProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: storyOwnerId,
        senderId: likerId,
        type: 'like',
        title: i18n.t('notifications.newLikeTitle'),
        message: String(i18n.t(notificationData.i18n.messageKey, notificationData.i18n.params)),
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      logger.error('Create like notification error:', error);
    }
  },

  async createCommentNotification(commenterId: string, storyOwnerId: string, commenterName: string, storyTitle: string, storyId: string, commentText: string) {
    try {
      let commenterProfileImage = null;
      try {
        const commenterDoc = await getDoc(doc(getFirestore(), 'users', commenterId));
        if (commenterDoc.exists()) {
          commenterProfileImage = commenterDoc.data()?.profileImage;
        }
      } catch (error) {
        logger.debug('Error getting commenter profile image:', error);
      }

      const notificationData: any = {
        storyId,
        storyTitle,
        commentText,
        i18n: {
          titleKey: 'notifications.newCommentTitle',
          messageKey: 'notifications.storyCommentMessage',
          params: { name: commenterName, story: storyTitle },
        },
      };

      if (commenterProfileImage) {
        notificationData.commenterProfileImage = commenterProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: storyOwnerId,
        senderId: commenterId,
        type: 'comment',
        title: i18n.t('notifications.newCommentTitle'),
        message: i18n.t('notifications.storyCommentMessage', { name: commenterName, story: storyTitle }),
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      logger.error('Create comment notification error:', error);
    }
  },

  async createMentionNotification(mentionerId: string, mentionedUserId: string, mentionerName: string, storyTitle: string, storyId: string) {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: mentionedUserId,
        senderId: mentionerId,
        type: 'mention',
        title: i18n.t('notifications.mentionTitle'),
        message: i18n.t('notifications.mentionMessage', { name: mentionerName, story: storyTitle }),
        data: {
          storyId,
          storyTitle,
          i18n: {
            titleKey: 'notifications.mentionTitle',
            messageKey: 'notifications.mentionMessage',
            params: { name: mentionerName, story: storyTitle },
          },
        },
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      logger.error('Create mention notification error:', error);
    }
  },

  async createWelcomeNotification(userId: string, userName: string) {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        senderId: userId,
        type: 'welcome',
        title: i18n.t('notifications.welcomeTitle'),
        message: i18n.t('notifications.welcomeMessage', { name: userName }),
        data: {
          i18n: {
            titleKey: 'notifications.welcomeTitle',
            messageKey: 'notifications.welcomeMessage',
            params: { name: userName },
          },
        },
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      logger.error('Create welcome notification error:', error);
    }
  },

  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>) {
    const previous = store.getState().notification.settings;
    if (previous) {
      store.dispatch(patchNotification({ settings: { ...previous, ...settings } }));
    }
    try {
      const db = getFirestore();
      const settingsRef = doc(db, 'notificationSettings', userId);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Update notification settings error:', error);
      if (previous) store.dispatch(patchNotification({ settings: previous }));
    }
  },

  getUnreadCount(): number {
    return store.getState().notification.unreadCount;
  },

  hasUnreadNotifications(): boolean {
    return store.getState().notification.unreadCount > 0;
  },
};

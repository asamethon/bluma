import { pushNotificationService } from '@/services/pushNotificationService';
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
import { store } from './index';
import { patchNotification } from './slices/notificationSlice';

export type { NotificationState } from './slices/notificationSlice';

// Notification actions
export const notificationActions = {
  // Initialize notifications for a user
  async initializeNotifications(userId: string) {
    try {
      console.log('Initializing notifications for userId:', userId);
      store.dispatch(patchNotification({ isLoading: true }));
      
      const db = getFirestore();
      const notificationsRef = collection(db, 'notifications');
      
      // Get user's notifications
      const q = firestoreQuery(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      console.log('Firestore query created for notifications');
      
      // Listen for real-time updates
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('Notifications snapshot received:', {
          empty: snapshot.empty,
          size: snapshot.size,
          docs: snapshot.docs.length,
        });
        
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
        
        console.log('Processed notifications:', {
          total: notifications.length,
          unread: unreadCount,
        });
        
        store.dispatch(patchNotification({ notifications, unreadCount }));
        
        // Badge count update removed - using local notifications only
      }, (error) => {
        console.error('Firestore snapshot error:', error);
      });
      
      // Load notification settings
      await notificationActions.loadNotificationSettings(userId);
      
      store.dispatch(patchNotification({ isLoading: false }));
      console.log('Notifications initialization completed');

      return unsubscribe; // Return unsubscribe function
    } catch (error) {
      console.error('Initialize notifications error:', error);
      store.dispatch(patchNotification({ isLoading: false }));
    }
  },

  // Load notification settings
  async loadNotificationSettings(userId: string) {
    try {
      const db = getFirestore();
      const settingsRef = doc(db, 'notificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        store.dispatch(patchNotification({ settings: settingsDoc.data() as NotificationSettings }));
      } else {
        // Create default settings
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
      console.error('Load notification settings error:', error);
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, 'notifications', notificationId);
      
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  // Mark all notifications as read
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
      console.error('Mark all as read error:', error);
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  },

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const db = getFirestore();
      const notificationsRef = collection(db, 'notifications');
      
      // Undefined, null, empty string ve empty array değerlerini filtrele
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
      console.error('Create notification error:', error);
    }
  },

  // Yazarın takipçilerine "yeni hikâye" / "yeni bölüm" duyurusu (in-app + push).
  // Yayınlama ve bölüm ekleme olaylarında storyStore'dan arka planda çağrılır;
  // hata olursa yayınlama akışını etkilemez.
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

      const title = kind === 'new_story' ? 'Yeni Hikâye' : 'Yeni Bölüm';
      const message =
        kind === 'new_story'
          ? `${authorName} yeni bir hikâye yayınladı: "${storyTitle}"`
          : `${authorName}, "${storyTitle}" hikâyesine yeni bir bölüm ekledi${chapterNumber ? ` (Bölüm ${chapterNumber})` : ''}`;

      await Promise.all(
        followersSnapshot.docs.map(async (followerDoc: any) => {
          const followerId = followerDoc.id;
          if (!followerId || followerId === authorId) return;
          try {
            await notificationActions.createNotification({
              userId: followerId,
              type: kind === 'new_story' ? 'story_published' : 'new_chapter',
              title,
              message,
              data: {
                storyId,
                storyTitle,
                ...(chapterNumber ? { chapterNumber } : {}),
              } as any,
              isRead: false,
            });
            await pushNotificationService.sendNotificationToUser(followerId, title, message, {
              type: 'story',
              storyId,
            });
          } catch (error) {
            console.error('Announce to follower error:', followerId, error);
          }
        })
      );
    } catch (error) {
      console.error('Announce story to followers error:', error);
    }
  },

  // Create follow notification
  async createFollowNotification(followerId: string, followedUserId: string, followerName: string) {
    try {
      // Get follower's profile image
      let followerProfileImage = null;
      try {
        const followerDoc = await getDoc(doc(getFirestore(), 'users', followerId));
        if (followerDoc.exists()) {
          followerProfileImage = followerDoc.data()?.profileImage;
        }
      } catch (error) {
        console.log('Error getting follower profile image:', error);
      }

      const notificationData: any = {
        followerId,
      };
      
      // Sadece profile image varsa ekle
      if (followerProfileImage) {
        notificationData.followerProfileImage = followerProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: followedUserId,
        type: 'follow',
        title: 'Yeni Takipçi',
        message: `${followerName} seni takip etmeye başladı`,
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
      
      // Send push notification to the user being followed
      try {
        await pushNotificationService.sendNotificationToUser(
          followedUserId,
          'Yeni Takipçi!',
          `${followerName} seni takip etmeye başladı.`,
          {
            type: 'profile',
            userId: followerId,
            profileImage: followerProfileImage
          }
        );
      } catch (error) {
        console.log('Push notification error:', error);
      }
    } catch (error) {
      console.error('Create follow notification error:', error);
    }
  },

  // Create like notification
  async createLikeNotification(likerId: string, storyOwnerId: string, likerName: string, storyTitle: string, storyId: string, isConversation: boolean = false) {
    try {
      // Get liker's profile image
      let likerProfileImage = null;
      try {
        const likerDoc = await getDoc(doc(getFirestore(), 'users', likerId));
        if (likerDoc.exists()) {
          likerProfileImage = likerDoc.data()?.profileImage;
        }
      } catch (error) {
        console.log('Error getting liker profile image:', error);
      }

      const notificationData: any = {
        storyId,
        storyTitle,
      };
      
      // Sadece profile image varsa ekle
      if (likerProfileImage) {
        notificationData.likerProfileImage = likerProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: storyOwnerId,
        type: 'like',
        title: 'Yeni Beğeni',
        message: `${likerName} "${storyTitle}" hikayeni beğendi`,
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      console.error('Create like notification error:', error);
    }
  },

  // Create comment notification
  async createCommentNotification(commenterId: string, storyOwnerId: string, commenterName: string, storyTitle: string, storyId: string, commentText: string) {
    try {
      // Get commenter's profile image
      let commenterProfileImage = null;
      try {
        const commenterDoc = await getDoc(doc(getFirestore(), 'users', commenterId));
        if (commenterDoc.exists()) {
          commenterProfileImage = commenterDoc.data()?.profileImage;
        }
      } catch (error) {
        console.log('Error getting commenter profile image:', error);
      }

      const notificationData: any = {
        storyId,
        storyTitle,
        commentText,
      };
      
      // Sadece profile image varsa ekle
      if (commenterProfileImage) {
        notificationData.commenterProfileImage = commenterProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: storyOwnerId,
        type: 'comment',
        title: 'Yeni Yorum',
        message: `${commenterName} "${storyTitle}" hikayene yorum yaptı`,
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      console.error('Create comment notification error:', error);
    }
  },

  // Create conversation like notification
  async createConversationLikeNotification(likerId: string, conversationOwnerId: string, likerName: string, conversationId: string) {
    try {
      if (likerId === conversationOwnerId) return; // Don't notify if user likes their own conversation
      
      // Get liker's profile image
      let likerProfileImage = null;
      try {
        const likerDoc = await getDoc(doc(getFirestore(), 'users', likerId));
        if (likerDoc.exists()) {
          likerProfileImage = likerDoc.data()?.profileImage;
        }
      } catch (error) {
        console.log('Error getting liker profile image:', error);
      }

      const notificationData: any = {
        conversationId,
      };
      
      // Sadece profile image varsa ekle
      if (likerProfileImage) {
        notificationData.likerProfileImage = likerProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: conversationOwnerId,
        type: 'like',
        title: 'Yeni Beğeni',
        message: `${likerName} mesajını beğendi`,
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
      
      // Send push notification
      try {
        await pushNotificationService.sendNotificationToUser(
          conversationOwnerId,
          'Mesajın Beğenildi!',
          `${likerName} mesajını beğendi.`,
          {
            type: 'conversation',
            conversationId
          }
        );
      } catch (error) {
        console.log('Push notification error:', error);
      }
    } catch (error) {
      console.error('Create conversation like notification error:', error);
    }
  },

  // Create conversation comment notification
  async createConversationCommentNotification(commenterId: string, conversationOwnerId: string, commenterName: string, conversationId: string, commentText: string) {
    try {
      if (commenterId === conversationOwnerId) return; // Don't notify if user comments on their own conversation
      
      // Get commenter's profile image
      let commenterProfileImage = null;
      try {
        const commenterDoc = await getDoc(doc(getFirestore(), 'users', commenterId));
        if (commenterDoc.exists()) {
          commenterProfileImage = commenterDoc.data()?.profileImage;
        }
      } catch (error) {
        console.log('Error getting commenter profile image:', error);
      }

      const notificationData: any = {
        conversationId,
        commentText,
      };
      
      // Sadece profile image varsa ekle
      if (commenterProfileImage) {
        notificationData.commenterProfileImage = commenterProfileImage;
      }

      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: conversationOwnerId,
        type: 'comment',
        title: 'Yeni Yorum',
        message: `${commenterName} mesajına yorum yaptı`,
        data: notificationData,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
      
      // Send push notification
      try {
        await pushNotificationService.sendNotificationToUser(
          conversationOwnerId,
          'Yeni Yorum!',
          `${commenterName} mesajına yorum yaptı.`,
          {
            type: 'conversation',
            conversationId
          }
        );
      } catch (error) {
        console.log('Push notification error:', error);
      }
    } catch (error) {
      console.error('Create conversation comment notification error:', error);
    }
  },

  // Create mention notification
  async createMentionNotification(mentionerId: string, mentionedUserId: string, mentionerName: string, storyTitle: string, storyId: string) {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: mentionedUserId,
        type: 'mention',
        title: 'Seni Etiketledi',
        message: `${mentionerName} "${storyTitle}" hikayesinde seni etiketledi`,
        data: {
          storyId,
          storyTitle,
        },
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      console.error('Create mention notification error:', error);
    }
  },

  // Create welcome notification
  async createWelcomeNotification(userId: string, userName: string) {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        type: 'welcome',
        title: 'Bluma\'ya Hoş Geldin!',
        message: `Merhaba ${userName}! Hikayelerini paylaşmaya başlayabilirsin.`,
        isRead: false,
      };
      
      await notificationActions.createNotification(notification);
    } catch (error) {
      console.error('Create welcome notification error:', error);
    }
  },

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>) {
    try {
      const db = getFirestore();
      const settingsRef = doc(db, 'notificationSettings', userId);
      
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      const currentSettings = store.getState().notification.settings;
      if (currentSettings) {
        store.dispatch(patchNotification({ settings: { ...currentSettings, ...settings } }));
      }
    } catch (error) {
      console.error('Update notification settings error:', error);
    }
  },

  // Get unread count
  getUnreadCount(): number {
    return store.getState().notification.unreadCount;
  },

  // Check if user has unread notifications
  hasUnreadNotifications(): boolean {
    return store.getState().notification.unreadCount > 0;
  },
};

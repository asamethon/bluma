import type { FirestoreDate } from './firestore';
// Bildirim metninin dilden bağımsız tarifi: metin okuyanın cihazında üretilir.
export interface NotificationI18n {
  titleKey: string;
  messageKey?: string;
  params?: Record<string, string | number>;
}

type NotificationType =
  | 'follow'
  | 'follow_request'
  | 'follow_accepted'
  | 'like'
  | 'comment'
  | 'mention'
  | 'story_published'
  | 'new_chapter'
  | 'welcome'
  | 'conversation_announcement'
  | 'announcement'
  | 'verify_email';

export interface Notification {
  id: string;
  userId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    storyId?: string;
    conversationId?: string;
    commentId?: string;
    followerId?: string;
    storyTitle?: string;
    commentText?: string;
    followerProfileImage?: string;
    likerProfileImage?: string;
    commenterProfileImage?: string;
    chapterIndex?: string;
    chapterNumber?: string;
    authorId?: string;
    authorName?: string;
    url?: string;
    route?: string;
    i18n?: NotificationI18n;
  };
  isRead: boolean;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  // İstemcide doldurulur (dokümanda saklanmaz): avatar ve eski kayıtların
  // metnini yerelleştirmek için gönderenin adı.
  senderName?: string;
  senderAvatar?: string;
}

export interface NotificationSettings {
  userId: string;
  followNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  mentionNotifications: boolean;
  storyNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: FirestoreDate;
}

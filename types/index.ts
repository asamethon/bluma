// Gizlilik tercihleri kullanıcı dokümanında (users/{uid}.privacy) yaşar:
// karşı taraftaki istemcinin de okuyabilmesi gerekir.
export interface PrivacySettings {
  privateAccount: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  discoverable: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  bio?: string;
  interests?: string[];
  intent?: 'reader' | 'writer' | 'both';
  website?: string;
  location?: string;
  authProvider: 'email' | 'google' | 'apple';
  followersCount?: number;
  followingCount?: number;
  storiesCount?: number;
  profileImage?: string;
  privacy?: PrivacySettings;
  lastActiveAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  authorId: string;
  author: User;
  coverImage?: string;
  category: StoryCategory;
  tags: string[];
  isCompleted: boolean;
  isPublished: boolean;
  chaptersCount: number;
  totalReadingTime: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPremium: boolean;
  language?: string;
  targetAudience?: 'all' | 'teen' | 'adult';
  contentWarnings?: string[];
}

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  authorId: string;
  author: User;
  coverImage?: string;
  category: StoryCategory;
  tags: string[];
  isCompleted: boolean;
  isPublished: boolean;
  chaptersCount: number;
  readingTime: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPremium: boolean;
  isEditorsPick?: boolean;
  isMock?: boolean;
  bookId?: string;
  chapterNumber?: number;
  isBook?: boolean;
  language?: string;
  targetAudience?: 'all' | 'teen' | 'adult';
  contentWarnings?: string[];
  chapterTitles?: string[];
  isHidden?: boolean;
  chaptersInSubcollection?: boolean;
  chapterWordCounts?: number[];
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  chapterNumber: number;
  readingTime: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  excerpt?: string;
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  user: User;
  content: string;
  likesCount: number;
  createdAt: Date;
  parentId?: string;
  replies?: Comment[];
  chapterIndex?: number;
}

export interface ReadingList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  stories: Story[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Bildirim metninin dilden bağımsız tarifi: metin okuyanın cihazında üretilir.
export interface NotificationI18n {
  titleKey: string;
  messageKey?: string;
  params?: Record<string, string | number>;
}

export interface Notification {
  id: string;
  userId: string;
  senderId: string;
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'like' | 'comment' | 'mention' | 'story_published' | 'new_chapter' | 'welcome' | 'conversation_announcement';
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
    authorId?: string;
    authorName?: string;
    i18n?: NotificationI18n;
  };
  isRead: boolean;
  createdAt: any;
  updatedAt: any;
  // İstemcide doldurulur (dokümanda saklanmaz): avatar ve eski kayıtların
  // metnini yerelleştirmek için gönderenin adı.
  senderName?: string;
  senderAvatar?: string;
}

export interface Conversation {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  tags?: string[];
  category?: string;
}

export interface ConversationComment {
  id: string;
  conversationId: string;
  userId: string;
  user: User;
  content: string;
  image?: string;
  likesCount: number;
  createdAt: any;
  parentId?: string;
  replies?: ConversationComment[];
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
  updatedAt: any;
}

export type StoryCategory = 
  | 'romance'
  | 'fantasy'
  | 'mystery'
  | 'drama'
  | 'adventure'
  | 'horror'
  | 'comedy'
  | 'poetry'
  | 'sci_fi'
  | 'other';

export type NotificationType = 
  | 'new_chapter'
  | 'new_follower'
  | 'story_liked'
  | 'story_commented'
  | 'mention';

export interface SharedStory {
  id: string;
  title: string;
  coverImage?: string;
  authorName?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  image?: string;
  story?: SharedStory;
  createdAt: any;
  clientId?: string;
  // Yalnızca istemcide duran iyimser (henüz sunucuya yazılmamış) kopya.
  pending?: boolean;
}

// WhatsApp benzeri gönderim durumu: saat → tek tik → soluk çift tik → mavi çift tik.
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageThread {
  id: string;
  participants: string[];
  lastMessage?: { text: string; senderId: string; createdAt: any } | null;
  updatedAt?: any;
  otherUser?: User | null;
  unread: number;
}

export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}
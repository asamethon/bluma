// Bluma App - Type Definitions

export interface User {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  bio?: string;
  interests?: string[];
  website?: string;
  location?: string;
  authProvider: 'email' | 'google' | 'apple';
  followersCount?: number;
  followingCount?: number;
  storiesCount?: number;
  profileImage?: string;
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
  totalReadingTime: number; // in minutes
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
  readingTime: number; // in minutes
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPremium: boolean;
  // Home feed features
  isEditorsPick?: boolean;
  // Demo indicator
  isMock?: boolean;
  // New fields for book-like functionality
  bookId?: string; // If this story is part of a book
  chapterNumber?: number; // Chapter number if part of a book
  isBook?: boolean; // Whether this is a book (has chapters)
  // Additional metadata fields
  language?: string;
  targetAudience?: 'all' | 'teen' | 'adult';
  contentWarnings?: string[];
  chapterTitles?: string[]; // Bölüm başlıkları
  isHidden?: boolean; // Admin tarafından şikayet üzerine gizlenmiş (bkz. YAPILACAKLAR 2.7)
  chaptersInSubcollection?: boolean; // true ise içerik stories/{id}/chapters alt koleksiyonunda (bkz. YAPILACAKLAR 2.2)
  chapterWordCounts?: number[]; // Stüdyo kartında içeriği indirmeden kelime sayısı göstermek için
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
  excerpt?: string; // First few sentences for preview
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  user: User;
  content: string;
  likesCount: number;
  createdAt: Date;
  parentId?: string; // for replies
  replies?: Comment[];
  chapterIndex?: number; // Hangi bölüme yazıldığı (bkz. YAPILACAKLAR 2.3)
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

export interface Notification {
  id: string;
  userId: string; // Bildirimin alıcısı
  senderId: string; // Bildirimi tetikleyen kullanıcı (spoof'u önlemek için kural bununla eşleşir)
  type: 'follow' | 'like' | 'comment' | 'mention' | 'story_published' | 'new_chapter' | 'welcome' | 'conversation_announcement';
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
    chapterIndex?: string; // Bölüm-bazlı beğeni bildirimi (bkz. YAPILACAKLAR 2.3)
    authorId?: string; // announceConversationToFollowers
    authorName?: string;
  };
  isRead: boolean;
  createdAt: any;
  updatedAt: any;
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
  isActive: boolean; // Konuşma aktif mi (yorum yapılabilir mi)
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
  image?: string; // base64 image data
  likesCount: number;
  createdAt: any;
  parentId?: string; // for replies
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

// ── Direct messaging (DM) ─────────────────────────────────────────────────
// Bire bir sohbet. Thread doküman ID'si iki katılımcı ID'sinden deterministik
// üretilir (`sortedA_sortedB`) — böylece aynı iki kişi hep aynı thread'e düşer.
export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  image?: string;
  createdAt: any; // Firestore Timestamp
}

export interface MessageThread {
  id: string;
  participants: string[];
  lastMessage?: { text: string; senderId: string; createdAt: any } | null;
  updatedAt?: any;
  // Karşı taraf (mevcut kullanıcı olmayan katılımcı) — listener tarafından çözülür.
  otherUser?: User | null;
  // Mevcut kullanıcının okunmamış mesaj sayısı.
  unread: number;
}

export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}
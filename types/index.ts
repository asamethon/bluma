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
  type: 'follow' | 'like' | 'comment' | 'mention' | 'story_published' | 'new_chapter' | 'welcome';
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

export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}
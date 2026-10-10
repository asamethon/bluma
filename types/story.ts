import type { User } from './user';

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

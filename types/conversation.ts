import type { FirestoreDate } from './firestore';
import type { User } from './user';

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
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
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
  createdAt: FirestoreDate;
  parentId?: string;
  replies?: ConversationComment[];
}

import type { FirestoreDate } from './firestore';
import type { User } from './user';

export interface Conversation {
  id: string;
  authorId: string;
  author: User;
  /**
   * Gönderinin durduğu pano (yazar panosu). Kendi profiline yazılan
   * gönderide `authorId` ile aynıdır. Alan HİÇ YOKSA gönderi eski
   * istemcinin açtığı bir konuşmadır ve yazarın kendi panosunda sayılır —
   * geriye dönük dolum (backfill) yapılmaz.
   */
  boardOwnerId?: string;
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
  // İstemcide doldurulur (dokümanda saklanmaz): pano sahibinin künyesi,
  // "yazar ▸ pano sahibi" etiketini basmak için.
  boardOwner?: User;
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

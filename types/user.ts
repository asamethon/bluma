import type { FirestoreDate } from './firestore';
// Gizlilik tercihleri kullanıcı dokümanında (users/{uid}.privacy) yaşar:
// karşı taraftaki istemcinin de okuyabilmesi gerekir.
/** Yazar panosuna kimler gönderi bırakabilir. Alan yoksa 'everyone'. */
export type BoardPostPolicy = 'everyone' | 'following' | 'nobody';

export interface PrivacySettings {
  privateAccount: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  discoverable: boolean;
  /** Eski dokümanlarda yok; okuyan her yer 'everyone' varsayar. */
  boardPosts?: BoardPostPolicy;
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
  /** Kayıt sırası; yalnızca admin script'i yazar (scripts/milestone-1k.cjs). */
  memberNumber?: number;
  profileImage?: string;
  coverImage?: string | null;
  privacy?: PrivacySettings;
  lastActiveAt?: FirestoreDate;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

import { observable } from '@legendapp/state';

// authState$/User buradan ayrı tutulur: store/authStore.ts servisleri
// (features/auth/services/*) import ediyor, servisler de authState$'a
// ihtiyaç duyuyordu — ikisi authStore.ts üzerinden birbirine bağlanınca
// require cycle oluşuyordu (authStore -> service -> authStore).
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

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isGuest: boolean;
  user: User | null;
  token: string | null;
}

export const authState$ = observable<AuthState>({
  isLoading: true, // true until initializeAuth() completes
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isGuest: false,
  user: null,
  token: null,
});

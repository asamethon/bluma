import { observable } from '@legendapp/state';
import { emailAuthActions } from '@/features/auth/services/emailAuth';
import { followRelationsActions } from '@/features/auth/services/followRelations';
import { sessionActions } from '@/features/auth/services/session';
import { socialAuthActions } from '@/features/auth/services/socialAuth';
import { userProfileActions } from '@/features/auth/services/userProfile';

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

// Create observable state
export const authState$ = observable<AuthState>({
  isLoading: true, // true until initializeAuth() completes
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isGuest: false,
  user: null,
  token: null,
});

export const authActions = {
  ...sessionActions,
  ...emailAuthActions,
  ...socialAuthActions,
  ...userProfileActions,
  ...followRelationsActions,
};

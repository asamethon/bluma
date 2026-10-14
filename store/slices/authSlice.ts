import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PrivacySettings } from '@/types';

export interface User {
  id: string;
  /**
   * Firebase Auth'tan gelir — herkese açık `users/{uid}` dokümanında
   * TUTULMAZ (bkz. features/auth/services/privateAccount.ts).
   */
  email: string;
  displayName: string;
  username?: string;
  bio?: string;
  interests?: string[];
  website?: string;
  location?: string;
  authProvider: 'email' | 'google' | 'apple';
  /** Özel hesap dokümanından yüklenir; herkese açık dokümanda tutulmaz. */
  appleUserId?: string;
  followersCount?: number;
  followingCount?: number;
  storiesCount?: number;
  profileImage?: string;
  coverImage?: string | null;
  privacy?: PrivacySettings;
  lastActiveAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isGuest: boolean;
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isGuest: false,
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    patchAuth(state, action: PayloadAction<Partial<AuthState>>) {
      Object.assign(state, action.payload);
    },
    patchUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) Object.assign(state.user, action.payload);
    },
  },
});

export const { patchAuth, patchUser } = authSlice.actions;
export default authSlice.reducer;

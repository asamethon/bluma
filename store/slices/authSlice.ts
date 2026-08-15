import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PrivacySettings } from '@/types';

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
  appleUserId?: string;
  followersCount?: number;
  followingCount?: number;
  storiesCount?: number;
  profileImage?: string;
  privacy?: PrivacySettings;
  lastActiveAt?: any;
  createdAt?: any;
  updatedAt?: any;
  // Kayıt anının bağlamı — yalnızca kullanıcı ilk oluşturulurken yazılır.
  signupPlatform?: 'ios' | 'android' | 'web';
  signupOsVersion?: string;
  signupAppVersion?: string;
  signupDeviceModel?: string;
  signupLanguage?: string;
  signupRegion?: string;
}

export interface AuthState {
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
    resetAuth() {
      return { ...initialState, isLoading: false };
    },
  },
});

export const { patchAuth, patchUser, resetAuth } = authSlice.actions;
export default authSlice.reducer;

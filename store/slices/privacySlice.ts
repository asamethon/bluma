import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Kullanıcının kendi tercihleri `auth.user.privacy` içinde yaşar; burada
// yalnızca ondan türetilemeyen yardımcı durum tutulur.
interface PrivacyState {
  // Takip edilenler: gizli hesapların içeriğini akışta filtrelemek için.
  followingIds: string[];
  loaded: boolean;
}

const initialState: PrivacyState = {
  followingIds: [],
  loaded: false,
};

const privacySlice = createSlice({
  name: 'privacy',
  initialState,
  reducers: {
    patchPrivacy(state, action: PayloadAction<Partial<PrivacyState>>) {
      Object.assign(state, action.payload);
    },
    addFollowingId(state, action: PayloadAction<string>) {
      if (!state.followingIds.includes(action.payload)) {
        state.followingIds.push(action.payload);
      }
    },
    removeFollowingId(state, action: PayloadAction<string>) {
      state.followingIds = state.followingIds.filter(id => id !== action.payload);
    },
    resetPrivacy() {
      return initialState;
    },
  },
});

export const { patchPrivacy, addFollowingId, removeFollowingId, resetPrivacy } = privacySlice.actions;
export default privacySlice.reducer;

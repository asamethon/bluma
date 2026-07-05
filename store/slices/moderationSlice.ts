import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModerationState {
  blockedUserIds: string[];
  loaded: boolean;
}

const initialState: ModerationState = {
  blockedUserIds: [],
  loaded: false,
};

const moderationSlice = createSlice({
  name: 'moderation',
  initialState,
  reducers: {
    patchModeration(state, action: PayloadAction<Partial<ModerationState>>) {
      Object.assign(state, action.payload);
    },
    addBlockedUser(state, action: PayloadAction<string>) {
      if (!state.blockedUserIds.includes(action.payload)) {
        state.blockedUserIds.push(action.payload);
      }
    },
    removeBlockedUser(state, action: PayloadAction<string>) {
      state.blockedUserIds = state.blockedUserIds.filter(id => id !== action.payload);
    },
  },
});

export const { patchModeration, addBlockedUser, removeBlockedUser } = moderationSlice.actions;
export default moderationSlice.reducer;

import { MessageThread } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MessagingState {
  threads: MessageThread[];
  threadsLoaded: boolean;
}

const initialState: MessagingState = {
  threads: [],
  threadsLoaded: false,
};

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    patchMessaging(state, action: PayloadAction<Partial<MessagingState>>) {
      Object.assign(state, action.payload as any);
    },
  },
});

export const { patchMessaging } = messagingSlice.actions;
export default messagingSlice.reducer;

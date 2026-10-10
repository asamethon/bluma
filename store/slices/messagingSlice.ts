import { DirectMessage, MessageThread } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MessagingState {
  threads: MessageThread[];
  threadsLoaded: boolean;
  previews: Record<string, DirectMessage | null>;
  replySources: Record<string, DirectMessage | null>;
}

const initialState: MessagingState = {
  threads: [],
  threadsLoaded: false,
  previews: {},
  replySources: {},
};

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setReplySource(state, { payload }: PayloadAction<{ key: string; message: DirectMessage | null }>) {
      state.replySources[payload.key] = payload.message;
    },
    setThreadPreview(state, { payload }: PayloadAction<{ key: string; message: DirectMessage | null }>) {
      state.previews[payload.key] = payload.message;
    },
    patchMessaging(state, action: PayloadAction<Partial<MessagingState>>) {
      Object.assign(state, action.payload as any);
    },
  },
});

export const { patchMessaging, setThreadPreview, setReplySource } = messagingSlice.actions;
export default messagingSlice.reducer;

import { Conversation, ConversationComment } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConversationState {
  conversations: Conversation[];
  userConversations: Conversation[];
  likedConversationIds: string[];
  isLoading: boolean;
  currentConversation: Conversation | null;
  currentConversationComments: ConversationComment[];
}

const initialState: ConversationState = {
  conversations: [],
  userConversations: [],
  likedConversationIds: [],
  isLoading: true,
  currentConversation: null,
  currentConversationComments: [],
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    patchConversation(state, action: PayloadAction<Partial<ConversationState>>) {
      Object.assign(state, action.payload as any);
    },
  },
});

export const { patchConversation } = conversationSlice.actions;
export default conversationSlice.reducer;

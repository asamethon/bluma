import type { DirectMessage } from '@/types';
import type { MessageRemoval } from '@/features/messaging/utils/messageVisibility';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ChatMessages = {
  messages: DirectMessage[];
  pending: DirectMessage[];
  removals: Record<string, MessageRemoval>;
};
export const EMPTY_CHAT: ChatMessages = { messages: [], pending: [], removals: {} };
const chatSlice = createSlice({
  name: 'chat',
  initialState: {} as Record<string, ChatMessages>,
  reducers: {
    receiveMessages(state, { payload }: PayloadAction<{ threadId: string; messages: DirectMessage[] }>) {
      const chat = state[payload.threadId] ??= { messages: [], pending: [], removals: {} };
      chat.messages = payload.messages;
      const arrived = new Set(payload.messages.map(m => m.clientId).filter(Boolean));
      chat.pending = chat.pending.filter(m => !arrived.has(m.clientId));
    },
    addPendingMessage(state, { payload }: PayloadAction<{ threadId: string; message: DirectMessage }>) {
      const chat = state[payload.threadId] ??= { messages: [], pending: [], removals: {} };
      chat.pending.push(payload.message);
    },
    dropPendingMessage(state, { payload }: PayloadAction<{ threadId: string; clientId: string }>) {
      const chat = state[payload.threadId];
      if (chat) chat.pending = chat.pending.filter(m => m.clientId !== payload.clientId);
    },
    startMessageRemoval(state, { payload }: PayloadAction<{ threadId: string; removal: MessageRemoval }>) {
      const chat = state[payload.threadId];
      if (chat) chat.removals[payload.removal.message.id] = payload.removal;
    },
    finishMessageRemoval(state, { payload }: PayloadAction<{ threadId: string; messageId: string }>) {
      const removal = state[payload.threadId]?.removals[payload.messageId];
      if (removal) removal.animating = false;
    },
    rollbackMessageRemoval(state, { payload }: PayloadAction<{ threadId: string; messageId: string }>) {
      const chat = state[payload.threadId];
      const removal = chat?.removals[payload.messageId];
      if (!removal) return;
      chat.messages = chat.messages.map(m => m.id === payload.messageId ? removal.message : m);
      delete chat.removals[payload.messageId];
    },
    clearChatMessages: () => ({}),
  },
});
export const { receiveMessages, addPendingMessage, dropPendingMessage, startMessageRemoval,
  finishMessageRemoval, rollbackMessageRemoval, clearChatMessages } = chatSlice.actions;
export default chatSlice.reducer;

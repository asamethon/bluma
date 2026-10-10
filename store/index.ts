import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import challengeReducer from './slices/challengeSlice';
import chatReducer from './slices/chatSlice';
import conversationReducer from './slices/conversationSlice';
import messagingReducer from './slices/messagingSlice';
import moderationReducer from './slices/moderationSlice';
import notificationReducer from './slices/notificationSlice';
import preferencesReducer from './slices/preferencesSlice';
import privacyReducer from './slices/privacySlice';
import readingListReducer from './slices/readingListSlice';
import storyReducer from './slices/storySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    story: storyReducer,
    preferences: preferencesReducer,
    readingList: readingListReducer,
    moderation: moderationReducer,
    privacy: privacyReducer,
    challenge: challengeReducer,
    chat: chatReducer,
    notification: notificationReducer,
    conversation: conversationReducer,
    messaging: messagingReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;

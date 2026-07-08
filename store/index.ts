import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import challengeReducer from './slices/challengeSlice';
import conversationReducer from './slices/conversationSlice';
import messagingReducer from './slices/messagingSlice';
import moderationReducer from './slices/moderationSlice';
import notificationReducer from './slices/notificationSlice';
import preferencesReducer from './slices/preferencesSlice';
import readingListReducer from './slices/readingListSlice';
import storyReducer from './slices/storySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    story: storyReducer,
    preferences: preferencesReducer,
    readingList: readingListReducer,
    moderation: moderationReducer,
    challenge: challengeReducer,
    notification: notificationReducer,
    conversation: conversationReducer,
    messaging: messagingReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // State içinde Firestore Timestamp/FieldValue taşınıyor; serileştirme
      // denetimi bu yüzden kapalı. Immutability denetimi açık kalır.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

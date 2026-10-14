import { combineReducers, configureStore, type Reducer } from '@reduxjs/toolkit';
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

const appReducer = combineReducers({
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
});

export type RootState = ReturnType<typeof appReducer>;

/**
 * Oturum kapanışı. Kullanıcıya bağlı TÜM dilimler baştan başlar — eskiden
 * yalnızca auth ve privacy sıfırlanıyordu, bu yüzden kitaplık, okuma
 * listeleri, mesajlar ve görev ilerlemesi bir sonraki hesaba taşınıyordu.
 */
export const SESSION_RESET = 'session/reset';

const rootReducer: Reducer<RootState> = (state, action) => {
  // Tercihler (tema, dil) cihaza aittir; oturumdan bağımsız korunur.
  if (action.type === SESSION_RESET && state) {
    return appReducer({ preferences: state.preferences } as RootState, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

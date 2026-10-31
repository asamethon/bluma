import { combineReducers, configureStore, createAction, type UnknownAction } from '@reduxjs/toolkit';
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
import storyDraftReducer from './slices/storyDraftSlice';

const appReducer = combineReducers({
  auth: authReducer,
  story: storyReducer,
  storyDraft: storyDraftReducer,
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
 * Oturum kapandı (çıkış, hesap silme, geçersiz oturum). Kullanıcıya bağlı
 * TÜM dilimler baştan başlar. Eskiden yalnızca auth ve gizlilik
 * sıfırlanıyordu: kitaplık, okuma listeleri, mesajlar, bildirimler ve
 * engellenenler misafire ya da bir sonraki hesaba taşınıyordu.
 */
export const sessionEnded = createAction('session/ended');

function resetSessionState(state: RootState): RootState {
  const fresh = appReducer(undefined, sessionEnded());
  return {
    ...fresh,
    // Kimliği endSession'daki patchAuth tek seferde yazar; burada sıfırlanırsa
    // arada "yükleniyor" durumuna düşülüp rota değişirdi.
    auth: state.auth,
    // Cihaza ait: tema ve okuma tercihleri.
    preferences: state.preferences,
    // Herkese açık akış ve açık okuma ekranı misafirde de aynıdır; boşaltılırsa
    // yeniden yüklenene kadar ekran boş kalırdı. Çevrimdışı indirmeler cihaz
    // deposundadır.
    story: {
      ...fresh.story,
      stories: state.story.stories,
      storiesLoaded: state.story.storiesLoaded,
      currentStory: state.story.currentStory,
      storyComments: state.story.storyComments,
      storyCommentsHasMore: state.story.storyCommentsHasMore,
      offlineStories: state.story.offlineStories,
      isDownloading: state.story.isDownloading,
    },
    conversation: {
      ...fresh.conversation,
      conversations: state.conversation.conversations,
      isLoading: state.conversation.isLoading,
      currentConversation: state.conversation.currentConversation,
      currentConversationComments: state.conversation.currentConversationComments,
    },
  };
}

function rootReducer(state: RootState | undefined, action: UnknownAction): RootState {
  return sessionEnded.match(action) && state ? resetSessionState(state) : appReducer(state, action);
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

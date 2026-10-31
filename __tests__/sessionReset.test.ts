import { sessionEnded, store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { patchConversation } from '@/store/slices/conversationSlice';
import { patchMessaging } from '@/store/slices/messagingSlice';
import { patchModeration } from '@/store/slices/moderationSlice';
import { patchNotification } from '@/store/slices/notificationSlice';
import { patchPreferences } from '@/store/slices/preferencesSlice';
import { addFollowingId } from '@/store/slices/privacySlice';
import { patchReadingList } from '@/store/slices/readingListSlice';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';

const story = (id: string) => ({ id, title: id }) as Story;

describe('oturum kapanışı', () => {
  it('kullanıcıya bağlı verileri siler; herkese açık akışı ve cihaz tercihlerini korur', () => {
    store.dispatch(patchAuth({ isAuthenticated: true, user: { id: 'a' } as never }));
    store.dispatch(patchStory({
      stories: [story('public')], storiesLoaded: true,
      likedStories: [story('liked')], savedStories: [story('saved')],
      userStories: [story('mine')], publishedUserStories: [story('mine')],
      followingStories: [story('followed')], continueReading: [{ story: story('r'), chapterIndex: 1 }],
      continueReadingLoaded: true,
    }));
    store.dispatch(patchReadingList({ lists: [{ id: 'l', name: 'Liste', isPublic: false, storyIds: ['x'] }], loaded: true }));
    store.dispatch(patchModeration({ blockedUserIds: ['blocked'], loaded: true }));
    store.dispatch(patchNotification({ unreadCount: 3, notifications: [{ id: 'n' }] as never }));
    store.dispatch(patchMessaging({ threads: [{ id: 't' }] as never, threadsLoaded: true }));
    store.dispatch(patchConversation({ conversations: [{ id: 'public' }] as never, likedConversationIds: ['c'] }));
    store.dispatch(addFollowingId('friend'));
    store.dispatch(patchPreferences({ readingTheme: 'sepia' } as never));

    store.dispatch(sessionEnded());
    const state = store.getState();

    expect(state.story).toMatchObject({
      likedStories: [], savedStories: [], userStories: [], publishedUserStories: [],
      followingStories: [], continueReading: [], continueReadingLoaded: false,
      stories: [story('public')], storiesLoaded: true,
    });
    expect(state.readingList).toEqual({ lists: [], loaded: false });
    expect(state.moderation).toEqual({ blockedUserIds: [], loaded: false });
    expect(state.notification.unreadCount).toBe(0);
    expect(state.messaging.threads).toEqual([]);
    expect(state.conversation.likedConversationIds).toEqual([]);
    expect(state.conversation.conversations).toEqual([{ id: 'public' }]);
    expect(state.privacy.followingIds).toEqual([]);
    expect(state.preferences.readingTheme).toBe('sepia');
    // Kimlik endSession'daki patchAuth ile tek seferde değişir.
    expect(state.auth.user?.id).toBe('a');
  });
});

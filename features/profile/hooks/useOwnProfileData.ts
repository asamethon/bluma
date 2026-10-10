import { authActions } from '@/store/authStore';
import { challengeActions } from '@/store/challengeStore';
import { conversationActions } from '@/store/conversationStore';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { useEffect } from 'react';

export function useOwnProfileData() {
  const currentUser = useAppSelector(state => state.auth.user);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const isLoading = useAppSelector(state => state.story.isLoading);
  const stories = useAppSelector(state => state.story.publishedUserStories);
  const conversations = useAppSelector(state => state.conversation.userConversations);
  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId) return;
    storyActions.initializeRealTimeListeners();
    storyActions.setupPublishedUserStoriesListener(userId);
    authActions.setupUserListener(userId);
    void conversationActions.getUserConversations(userId);
    void conversationActions.getLikedConversations(userId);
    void challengeActions.loadProgress(userId);
    return () => {
      storyActions.cleanupRealTimeListeners();
      authActions.cleanupUserListener();
      conversationActions.cleanupListeners();
    };
  }, [userId]);

  return { conversations, currentUser, isGuest, isLoading, stories };
}

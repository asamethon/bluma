import { privacyActions } from '@/features/privacy/services/privacyService';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { messagingActions } from '@/store/messagingStore';
import { moderationActions } from '@/store/moderationStore';
import { preferencesActions } from '@/store/preferencesStore';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useHomeFeed() {
  const currentUser = useAppSelector(state => state.auth.user);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const rawStories = useAppSelector(state => state.story.stories);
  const rawFollowing = useAppSelector(state => state.story.followingStories);
  const blockedIds = useAppSelector(state => state.moderation.blockedUserIds);
  const matureContent = useAppSelector(state => state.preferences.showMatureContent);
  const followingIds = useAppSelector(state => state.privacy.followingIds);
  const network = useNetworkStatus();
  const offlineCount = useAppSelector(state => state.story.offlineStories.length);
  const [refreshing, setRefreshing] = useState(false);
  const userId = currentUser?.id;

  useEffect(() => {
    void preferencesActions.load();
    if (userId) {
      storyActions.initializeRealTimeListeners();
      void moderationActions.loadBlockedUsers();
      void privacyActions.load();
      messagingActions.startThreadsListener(userId);
    } else if (isGuest) {
      storyActions.setupStoriesListener();
      void storyActions.loadDiscoverStories();
    }
    return () => {
      storyActions.cleanupRealTimeListeners();
      messagingActions.stopThreadsListener();
    };
  }, [isGuest, userId]);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    void storyActions.refreshLikedStoriesState();
    void storyActions.loadOfflineStories();
    void readingProgressActions.loadContinueReadingShelf();
  }, [userId]));

  // Ana akış ve takip rafı aynı görünürlük zincirinden geçer: engel → gizli
  // hesap → moderasyon → +18 tercihi.
  const visible = useCallback((items: Story[]) => preferencesActions.filterMature(
    moderationActions.filterHidden(
      privacyActions.filterPrivateContent(
        moderationActions.filterBlocked(items, blockedIds),
        followingIds,
      ),
    ),
    matureContent,
    isGuest,
  ), [blockedIds, followingIds, isGuest, matureContent]);
  const stories = useMemo(() => visible(rawStories), [rawStories, visible]);
  const following = useMemo(() => visible(rawFollowing), [rawFollowing, visible]);

  // Hikâye akışı canlı dinleniyor; yenileme dinleyicinin kapsamadığı rafları
  // (takip, okumaya devam, beğeni durumu) sunucudan tazeler.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (network.isOffline) {
        await storyActions.loadOfflineStories();
      } else if (userId) {
        await Promise.all([
          storyActions.loadFollowingStories(),
          readingProgressActions.loadContinueReadingShelf(),
          storyActions.refreshLikedStoriesState(),
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [network.isOffline, userId]);

  return {
    currentUser,
    following,
    isGuest,
    network,
    offlineCount,
    refresh,
    refreshing,
    stories,
  };
}

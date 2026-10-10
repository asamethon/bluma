import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import type { User } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { getProfileConnections } from '../services/connections';
import { useProfileUser } from './useProfileUser';

export type ConnectionTab = 'followers' | 'following';

export function useConnections(profileId: string, initialTab: ConnectionTab) {
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const { user: profileUser } = useProfileUser(profileId);
  const access = useProfileAccess(profileUser);
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followingById, setFollowingById] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const connections = await getProfileConnections(profileId);
      setFollowers(connections.followers);
      setFollowing(connections.following);

      if (currentUserId) {
        const ids = [...new Set([...connections.followers, ...connections.following].map(user => user.id))]
          .filter(id => id !== currentUserId);
        const statuses = await Promise.all(ids.map(authActions.isFollowingUser));
        setFollowingById(Object.fromEntries(ids.map((id, index) => [id, statuses[index]])));
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const users = tab === 'followers' ? followers : following;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleUsers = useMemo(
    () => normalizedQuery
      ? users.filter(user =>
          user.displayName?.toLocaleLowerCase().includes(normalizedQuery)
          || user.username?.toLocaleLowerCase().includes(normalizedQuery))
      : users,
    [normalizedQuery, users],
  );

  const follow = useCallback(async (userId: string) => {
    const result = await authActions.followUser(userId);
    const pending = result.success && 'pending' in result && result.pending;
    if (result.success && !pending) {
      setFollowingById(current => ({ ...current, [userId]: true }));
    }
    return { ...result, pending };
  }, []);

  const unfollow = useCallback(async (userId: string) => {
    const result = await authActions.unfollowUser(userId);
    if (result.success) setFollowingById(current => ({ ...current, [userId]: false }));
    return result;
  }, []);

  return {
    access,
    currentUserId,
    followers,
    following,
    followingById,
    isLoading,
    profileUser,
    query,
    setQuery,
    setTab,
    tab,
    visibleUsers,
    follow,
    unfollow,
  };
}

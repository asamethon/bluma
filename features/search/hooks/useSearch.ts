import { trackSearchQuery } from '@/features/discovery/services/feedEvents';
import { searchUsers } from '@/features/search/services/userSearch';
import { privacyActions } from '@/features/privacy/services/privacyService';
import { useAppSelector } from '@/store/hooks';
import { moderationActions } from '@/store/moderationStore';
import { preferencesActions } from '@/store/preferencesStore';
import type { Story, User } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPublishedSearchStories } from '../services/searchCatalog';
import { useSearchHistory } from './useSearchHistory';

export function useSearch() {
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const matureEnabled = useAppSelector(state => state.preferences.showMatureContent);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const blockedIds = useAppSelector(state => state.moderation.blockedUserIds);
  const followingIds = useAppSelector(state => state.privacy.followingIds);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const history = useSearchHistory();

  useEffect(() => {
    const lifecycle = { active: true };
    setIsLoading(true);
    void getPublishedSearchStories()
      .then(items => { if (lifecycle.active) setStories(items); })
      .finally(() => { if (lifecycle.active) setIsLoading(false); });
    void preferencesActions.load();
    if (currentUserId) {
      void moderationActions.loadBlockedUsers();
      void privacyActions.load();
    }
    return () => { lifecycle.active = false; };
  }, [currentUserId]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setUsers([]);
      setIsSearchingUsers(false);
      return;
    }
    const lifecycle = { active: true };
    const timeout = setTimeout(() => {
      setIsSearchingUsers(true);
      void searchUsers(normalized)
        .then(result => { if (lifecycle.active) setUsers(result); })
        .catch(() => { if (lifecycle.active) setUsers([]); })
        .finally(() => { if (lifecycle.active) setIsSearchingUsers(false); });
    }, 250);
    return () => {
      lifecycle.active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const visibleStories = useMemo(() => {
    const allowed = preferencesActions.filterMature(
      moderationActions.filterHidden(
        privacyActions.filterPrivateContent(
          moderationActions.filterBlocked(stories, blockedIds),
          followingIds,
        ),
      ),
      matureEnabled,
      isGuest,
    );
    const byGenre = genre ? allowed.filter(story => story.category === genre) : allowed;
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? byGenre.filter(story =>
          `${story.title} ${story.author?.displayName || ''} ${story.description}`
            .toLocaleLowerCase().includes(normalized)
          || story.tags?.some(tag => tag.toLocaleLowerCase().includes(normalized)))
      : byGenre;
  }, [blockedIds, followingIds, genre, isGuest, matureEnabled, query, stories]);

  const busy = isLoading || isSearchingUsers;
  const idle = !query.trim() && !genre;
  const empty = !busy && visibleStories.length === 0 && users.length === 0;
  const resultCount = visibleStories.length + users.length;

  // Klavyeden "Ara"ya basıldı: geçmişe yaz ve sonuç sayısıyla ölç (sıfır
  // sonuçlu aramalar katalogdaki boşluğu gösterir).
  const addQuery = history.addQuery;
  const submitQuery = useCallback((value: string) => {
    addQuery(value);
    if (value.trim()) trackSearchQuery(value.trim().length, resultCount);
  }, [addQuery, resultCount]);

  return {
    busy, empty, genre, setGenre, history, idle, query, setQuery,
    submitQuery, users, visibleStories,
  };
}

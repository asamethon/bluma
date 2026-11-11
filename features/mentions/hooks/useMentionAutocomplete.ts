import { getUserById } from '@/features/auth/services/userCache';
import { searchUsers } from '@/features/search/services/userSearch';
import { useAppSelector } from '@/store/hooks';
import type { User } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { activeMentionQuery, insertMention } from '../utils/mentionQuery';

const MAX_SUGGESTIONS = 6;
const SEARCH_DELAY_MS = 150;
/** Tek başına `@` yazılınca önerilecek takip edilen kişi sayısı. */
const FOLLOWING_SEED = 12;

const lower = (value?: string) => (value ?? '').toLocaleLowerCase('tr-TR');
const matches = (user: User, query: string) =>
  lower(user.username).startsWith(query) || lower(user.displayName).startsWith(query);

/**
 * Yazı alanında `@` sonrası kişi önerileri.
 *
 * Tek başına `@`: sunucuya gidilmez, sohbetteki kişiler (`participants`) ve
 * takip edilenler önerilir. Eskiden boş sorgu `users` koleksiyonunun TAMAMINI
 * okuyordu; her `@` yüzlerce okuma demekti. Harf yazılınca önce eldeki kişiler
 * anında süzülür, sunucu araması kısa bir beklemeyle arkadan eklenir.
 */
export function useMentionAutocomplete(text: string, setText: (value: string) => void, participants: User[] = []) {
  const selfId = useAppSelector(state => state.auth.user?.id);
  const followingKey = useAppSelector(state => state.privacy.followingIds.slice(0, FOLLOWING_SEED).join(','));
  const query = activeMentionQuery(text);
  const term = lower(query ?? '');
  const wantsLocal = query !== null;
  const [following, setFollowing] = useState<User[]>([]);
  const [found, setFound] = useState<User[]>([]);

  useEffect(() => {
    if (!wantsLocal || !followingKey) return;
    const lifecycle = { cancelled: false };
    // Kullanıcı önbelleği 30 dk tutuyor; her `@` yeniden okutmaz.
    void Promise.all(followingKey.split(',').map(id => getUserById(id))).then(users => {
      if (!lifecycle.cancelled) setFollowing(users.filter((user): user is User => !!user?.username));
    });
    return () => { lifecycle.cancelled = true; };
  }, [followingKey, wantsLocal]);

  useEffect(() => {
    if (!term) return;
    const lifecycle = { cancelled: false };
    const timer = setTimeout(() => {
      void searchUsers(term).then(users => {
        if (!lifecycle.cancelled) setFound(users);
      });
    }, SEARCH_DELAY_MS);
    return () => {
      lifecycle.cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const suggestions = useMemo(() => {
    if (query === null) return [];
    const local = [...participants, ...following].filter(user => !term || matches(user, term));
    // Sunucu sonucu bir önceki harfe ait olabilir: yalnızca güncel sorguya uyanlar.
    const remote = term ? found.filter(user => matches(user, term)) : [];
    const seen = new Set<string>();
    return [...local, ...remote].filter(user => {
      if (!user?.id || !user.username || user.id === selfId || seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    }).slice(0, MAX_SUGGESTIONS);
  }, [following, found, participants, query, selfId, term]);

  const select = useCallback((username: string) => {
    if (username) setText(insertMention(text, username));
  }, [setText, text]);

  return { suggestions, select };
}

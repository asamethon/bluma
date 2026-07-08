import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { useEffect, useMemo, useState } from 'react';

// Mesajlar kutusu hook'u: global thread dinleyicisini (deep-link durumları için
// idempotent) garanti eder, store'daki thread'leri isme göre süzer.
export function useMessageThreads() {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const threads = useAppSelector((s) => s.messaging.threads);
  const threadsLoaded = useAppSelector((s) => s.messaging.threadsLoaded);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (userId) messagingActions.startThreadsListener(userId);
  }, [userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      (t.otherUser?.displayName || '').toLowerCase().includes(q)
    );
  }, [threads, query]);

  const totalUnread = useMemo(
    () => threads.reduce((n, t) => n + (t.unread || 0), 0),
    [threads]
  );

  return { threads: filtered, threadsLoaded, query, setQuery, totalUnread };
}

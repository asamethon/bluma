import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { MessageThread } from '@/types';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export function useMessageThreads() {
  const { t } = useTranslation();
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

  // Uzun basınca: sohbetin silinebileceğini anlat, onay alınca yalnızca bu
  // kullanıcı için gizle (karşı tarafın geçmişi korunur).
  const confirmDelete = useCallback(
    (thread: MessageThread) => {
      if (!userId) return;
      const name = thread.otherUser?.displayName || t('common.user');
      Alert.alert(
        t('messages.deleteThreadTitle', { name }),
        t('messages.deleteThreadBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('messages.deleteThread'),
            style: 'destructive',
            onPress: () => {
              messagingActions
                .hideThread(thread.id, userId)
                .catch((e) => logger.error('Hide thread error:', e));
            },
          },
        ]
      );
    },
    [userId, t]
  );

  return { threads: filtered, threadsLoaded, query, setQuery, totalUnread, confirmDelete };
}

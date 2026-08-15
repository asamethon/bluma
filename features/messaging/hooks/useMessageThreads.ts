import { MOCK_THREADS, SHOW_MOCK_DATA } from '@/constants/mockData';
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

  const withMock = useMemo(
    () => (SHOW_MOCK_DATA ? [...MOCK_THREADS, ...threads] : threads),
    [threads]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withMock;
    return withMock.filter((t) =>
      (t.otherUser?.displayName || '').toLowerCase().includes(q)
    );
  }, [withMock, query]);

  const totalUnread = useMemo(
    () => withMock.reduce((n, t) => n + (t.unread || 0), 0),
    [withMock]
  );

  // Uzun basınca: sohbetin silinebileceğini anlat, onay alınca yalnızca bu
  // kullanıcı için gizle (karşı tarafın geçmişi korunur).
  const confirmDelete = useCallback(
    (thread: MessageThread) => {
      if (!userId || thread.id.startsWith('mock_')) return;
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

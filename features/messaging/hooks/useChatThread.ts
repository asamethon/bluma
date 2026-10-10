import {
  listenThreadDoc,
  threadIdFor,
} from '@/features/messaging/services/messagingService';
import { toMillis } from '@/features/messaging/utils/time';
import { getUserById } from '@/features/story/services/userCache';
import { messagingActions } from '@/store/messagingStore';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addPendingMessage, dropPendingMessage, EMPTY_CHAT } from '@/store/slices/chatSlice';
import { subscribeChatMessages } from '../services/chatMessages';
import { visibleMessages } from '../utils/messageVisibility';
import type { DirectMessage, User } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** Karşı taraf "yazıyor" damgasının taze sayıldığı süre. */
const TYPING_FRESH_WINDOW_MS = 5000;

type ThreadMarks = { deliveredUntil: number; readUntil: number; hiddenBefore: number; typingUntil: number };
const NO_MARKS: ThreadMarks = { deliveredUntil: 0, readUntil: 0, hiddenBefore: 0, typingUntil: 0 };

/** Sohbetin sunucu tarafı: profil, mesaj akışı ve thread filigranları. */
export function useChatThread(currentUserId?: string, otherUserId?: string) {
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [marks, setMarks] = useState<ThreadMarks>(NO_MARKS);
  const [otherTyping, setOtherTyping] = useState(false);

  const threadId = useMemo(
    () => (currentUserId && otherUserId ? threadIdFor(currentUserId, otherUserId) : null),
    [currentUserId, otherUserId],
  );
  const dispatch = useAppDispatch();
  const chat = useAppSelector(state => threadId ? state.chat[threadId] ?? EMPTY_CHAT : EMPTY_CHAT);
  const { messages: serverMessages, pending, removals } = chat;

  useEffect(() => {
    if (!otherUserId) return;
    const lifecycle = { active: true };
    void getUserById(otherUserId).then(user => {
      if (lifecycle.active) setOtherUser(user);
    });
    return () => { lifecycle.active = false; };
  }, [otherUserId]);

  useEffect(() => {
    if (!threadId || !currentUserId) return;
    return subscribeChatMessages(threadId, currentUserId);
  }, [threadId, currentUserId]);

  useEffect(() => {
    if (!threadId || !otherUserId || !currentUserId) return;
    return listenThreadDoc(threadId, data => {
      const typing = toMillis(data?.typing?.[otherUserId]);
      setMarks({
        typingUntil: typing ? typing + TYPING_FRESH_WINDOW_MS : 0,
        deliveredUntil: toMillis(data?.lastDelivered?.[otherUserId]),
        readUntil: toMillis(data?.lastRead?.[otherUserId]),
        hiddenBefore: toMillis(data?.deletedFor?.[currentUserId]),
      });
    });
  }, [threadId, otherUserId, currentUserId]);

  // "Yazıyor" damgası kendiliğinden bayatlar; süre dolunca gösterge kapanır.
  useEffect(() => {
    const remaining = marks.typingUntil - Date.now();
    if (remaining <= 0) {
      setOtherTyping(false);
      return;
    }
    setOtherTyping(true);
    const timer = setTimeout(() => setOtherTyping(false), remaining + 50);
    return () => clearTimeout(timer);
  }, [marks.typingUntil]);

  const lastMessageId = serverMessages.at(-1)?.id ?? null;
  useEffect(() => {
    if (threadId && currentUserId) messagingActions.markRead(threadId, currentUserId);
  }, [threadId, currentUserId, lastMessageId]);

  const messages = useMemo(() => visibleMessages(serverMessages, pending, removals, currentUserId, marks.hiddenBefore),
    [serverMessages, pending, removals, marks.hiddenBefore, currentUserId]);

  const addPending = useCallback((message: DirectMessage) => {
    if (threadId) dispatch(addPendingMessage({ threadId, message }));
  }, [dispatch, threadId]);
  const dropPending = useCallback(
    (clientId: string) => { if (threadId) dispatch(dropPendingMessage({ threadId, clientId })); },
    [dispatch, threadId],
  );

  return {
    threadId,
    otherUser,
    messages,
    otherTyping,
    deliveredUntil: marks.deliveredUntil,
    readUntil: marks.readUntil,
    addPending,
    dropPending,
  };
}

import { MOCK_CHAT_MESSAGES, SHOW_MOCK_DATA } from '@/constants/mockData';
import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import {
  listenMessages,
  listenThreadDoc,
  setTypingStatus,
  threadIdFor,
} from '@/features/messaging/services/messagingService';
import { getUserById } from '@/features/story/services/userCache';
import { toMillis } from '@/features/messaging/utils/time';
import { useCanMessage } from '@/features/privacy/hooks/useCanMessage';
import { usePresence } from '@/features/privacy/hooks/usePresence';
import { imageUploadService } from '@/services/imageUploadService';
import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { DirectMessage, User } from '@/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import i18n from '@/i18n';

const TYPING_WRITE_THROTTLE_MS = 3000;
const TYPING_FRESH_WINDOW_MS = 5000;

export function useChat(otherUserId?: string) {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  // Karşı taraf mesajları kapattıysa besteci kilitlenir (kurallar da reddeder).
  const { blocked: messagingBlocked } = useCanMessage(otherUserId);
  const presence = usePresence(otherUserId);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [serverMessages, setServerMessages] = useState<DirectMessage[]>([]);
  const [pending, setPending] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [otherTypingUntil, setOtherTypingUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  // Thread dokümanındaki filigranlar (bkz. utils/status.ts).
  const [deliveredUntil, setDeliveredUntil] = useState(0);
  const [readUntil, setReadUntil] = useState(0);
  const [hiddenBefore, setHiddenBefore] = useState(0);

  const threadId = useMemo(
    () => (currentUserId && otherUserId ? threadIdFor(currentUserId, otherUserId) : null),
    [currentUserId, otherUserId]
  );

  useEffect(() => {
    let alive = true;
    if (otherUserId) getUserById(otherUserId).then((u) => alive && setOtherUser(u));
    return () => {
      alive = false;
    };
  }, [otherUserId]);

  useEffect(() => {
    if (!threadId) return;
    const unsub = listenMessages(threadId, (msgs) => {
      setServerMessages(msgs);
      const arrived = new Set(msgs.map((m) => m.clientId).filter(Boolean));
      setPending((prev) => prev.filter((p) => !arrived.has(p.clientId)));
    });
    return unsub;
  }, [threadId]);

  useEffect(() => {
    if (!threadId || !otherUserId) return;
    return listenThreadDoc(threadId, (data) => {
      const typingMs = toMillis(data?.typing?.[otherUserId]);
      setOtherTypingUntil(typingMs ? typingMs + TYPING_FRESH_WINDOW_MS : 0);
      setDeliveredUntil(toMillis(data?.lastDelivered?.[otherUserId]));
      setReadUntil(toMillis(data?.lastRead?.[otherUserId]));
      if (currentUserId) setHiddenBefore(toMillis(data?.deletedFor?.[currentUserId]));
    });
  }, [threadId, otherUserId, currentUserId]);

  useEffect(() => {
    if (!otherTypingUntil) return;
    const remaining = otherTypingUntil - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return;
    }
    const t = setTimeout(() => setNow(Date.now()), remaining + 50);
    return () => clearTimeout(t);
  }, [otherTypingUntil]);

  const otherTyping = otherTypingUntil > now;

  const lastId = serverMessages.length ? serverMessages[serverMessages.length - 1].id : null;
  useEffect(() => {
    if (threadId && currentUserId) messagingActions.markRead(threadId, currentUserId);
  }, [threadId, currentUserId, lastId]);

  const lastTypingWriteRef = useRef(0);
  const clearOwnTyping = useCallback(() => {
    if (!currentUserId || !otherUserId) return;
    lastTypingWriteRef.current = 0;
    setTypingStatus({ senderId: currentUserId, recipientId: otherUserId, isTyping: false });
  }, [currentUserId, otherUserId]);

  const setDraftAndPingTyping = useCallback(
    (text: string) => {
      setDraft(text);
      if (!currentUserId || !otherUserId) return;
      if (!text) {
        clearOwnTyping();
        return;
      }
      const t = Date.now();
      if (t - lastTypingWriteRef.current > TYPING_WRITE_THROTTLE_MS) {
        lastTypingWriteRef.current = t;
        setTypingStatus({ senderId: currentUserId, recipientId: otherUserId, isTyping: true });
      }
    },
    [currentUserId, otherUserId, clearOwnTyping]
  );

  useEffect(() => {
    return () => {
      if (currentUserId && otherUserId) {
        setTypingStatus({ senderId: currentUserId, recipientId: otherUserId, isTyping: false });
      }
    };
  }, [currentUserId, otherUserId]);

  const mockPrefix = SHOW_MOCK_DATA && otherUserId?.startsWith('mock_') ? MOCK_CHAT_MESSAGES : [];
  const messages = useMemo(() => {
    // "Benim için sil" filigranından eskiler bu kullanıcıya gösterilmez.
    const visible = hiddenBefore
      ? serverMessages.filter((m) => toMillis(m.createdAt) > hiddenBefore)
      : serverMessages;
    return [...mockPrefix, ...visible, ...pending];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMessages, pending, hiddenBefore, mockPrefix.length]);

  const canSend = (draft.trim().length > 0 || !!selectedImage) && !isSending && !messagingBlocked;

  const pickImage = async () => {
    const uri = await imageUploadService.pickCommentImage();
    if (uri) setSelectedImage(uri);
  };

  const removeImage = () => setSelectedImage(null);

  const send = async () => {
    const text = draft.trim();
    if ((!text && !selectedImage) || !currentUserId || !otherUserId || messagingBlocked) return;

    // İyimser eklemeden ÖNCE: doğrulanmamış hesapta kurallar yazmayı reddeder
    // ve mesaj sebepsizce kaybolmuş gibi görünürdü.
    const verified = await assertEmailVerified();
    if (!verified.ok) {
      Alert.alert(i18n.t('common.error'), verified.error);
      return;
    }

    const imageUri = selectedImage;
    setDraft('');
    setSelectedImage(null);
    clearOwnTyping();

    let image: string | undefined;
    if (imageUri) {
      setIsSending(true);
      try {
        image = await imageUploadService.uploadCommentImage(imageUri);
      } catch {
        setIsSending(false);
        return;
      }
      setIsSending(false);
    }

    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localMsg: DirectMessage = {
      id: clientId,
      clientId,
      senderId: currentUserId,
      text,
      ...(image ? { image } : {}),
      createdAt: new Date(),
      pending: true,
    };
    setPending((prev) => [...prev, localMsg]);

    try {
      await messagingActions.send(currentUserId, otherUserId, text, image, clientId);
    } catch {
      setPending((prev) => prev.filter((m) => m.clientId !== clientId));
    }
  };

  return {
    currentUserId,
    otherUser,
    messages,
    draft,
    setDraft: setDraftAndPingTyping,
    canSend,
    send,
    selectedImage,
    pickImage,
    removeImage,
    isSending,
    otherTyping,
    deliveredUntil,
    readUntil,
    messagingBlocked,
    presence,
  };
}

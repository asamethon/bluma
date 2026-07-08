import {
  listenMessages,
  listenThreadDoc,
  setTypingStatus,
  threadIdFor,
} from '@/features/messaging/services/messagingService';
import { getUserById } from '@/features/story/services/userCache';
import { imageUploadService } from '@/services/imageUploadService';
import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { DirectMessage, User } from '@/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Tek sohbet hook'u: karşı kullanıcı profilini yükler, mesajları gerçek zamanlı
// dinler, açılışta + yeni mesaj geldiğinde okundu işaretler, optimistic gönderir
// ve yazma durumunu (typing) iki yönlü yönetir.
// Not: klavye yüksekliği burada değil, ChatScreen'de useAnimatedKeyboard ile
// takip edilir (bkz. o dosyadaki yorum — edge-to-edge Android'de
// Keyboard.addListener'ın resize-tabanlı ölçümü güvenilir değil).
const TYPING_WRITE_THROTTLE_MS = 3000;
const TYPING_FRESH_WINDOW_MS = 5000;

export function useChat(otherUserId?: string) {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [serverMessages, setServerMessages] = useState<DirectMessage[]>([]);
  // Optimistic mesajlar: send() anında eklenir, server listener aynı içeriği
  // bildirdiğinde ya da send resolve olduğunda düşer. Bunun sebebi: Firestore
  // orderBy(serverTimestamp) sorgusunda gönderenin kendi pending write'ını
  // yerel snapshot'a düşürmesi güvenilir değil — mesaj karşı tarafa varıyor
  // ama gönderen kendi ekranında göremiyordu.
  const [pending, setPending] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [otherTypingUntil, setOtherTypingUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const threadId = useMemo(
    () => (currentUserId && otherUserId ? threadIdFor(currentUserId, otherUserId) : null),
    [currentUserId, otherUserId]
  );

  // Karşı taraf profili (cache'li).
  useEffect(() => {
    let alive = true;
    if (otherUserId) getUserById(otherUserId).then((u) => alive && setOtherUser(u));
    return () => {
      alive = false;
    };
  }, [otherUserId]);

  // Mesaj dinleyicisi (dış sisteme abonelik — tek effect, cleanup'lı).
  // Server mesajları geldiğinde, aynı (senderId + text) eşleşen pending
  // mesajları düş.
  useEffect(() => {
    if (!threadId) return;
    const unsub = listenMessages(threadId, (msgs) => {
      setServerMessages(msgs);
      setPending((prev) =>
        prev.filter(
          (p) => !msgs.some((m) => m.senderId === p.senderId && m.text === p.text)
        )
      );
    });
    return unsub;
  }, [threadId]);

  // Thread doc dinleyicisi — karşı tarafın typing timestamp'i.
  useEffect(() => {
    if (!threadId || !otherUserId) return;
    return listenThreadDoc(threadId, (data) => {
      const ts = data?.typing?.[otherUserId];
      const ms = ts?.toMillis ? ts.toMillis() : ts?.toDate ? ts.toDate().getTime() : 0;
      setOtherTypingUntil(ms ? ms + TYPING_FRESH_WINDOW_MS : 0);
    });
  }, [threadId, otherUserId]);

  // "5sn içinde yazan var" tazeliği için hafif bir tick — indicator
  // pencerenin dışına çıkınca otomatik gizlensin diye.
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

  // Sohbet açık ve yeni mesaj geldiyse okundu işaretle.
  const lastId = serverMessages.length ? serverMessages[serverMessages.length - 1].id : null;
  useEffect(() => {
    if (threadId && currentUserId) messagingActions.markRead(threadId, currentUserId);
  }, [threadId, currentUserId, lastId]);

  // Yazma durumu yazımı throttle'lı — her tuşta değil, en az 3sn arayla
  // serverTimestamp yazarız. Çıkışta / gönderimde temizlenir.
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

  // Ekran unmount olduğunda kendi typing durumumuzu temizle.
  useEffect(() => {
    return () => {
      if (currentUserId && otherUserId) {
        setTypingStatus({ senderId: currentUserId, recipientId: otherUserId, isTyping: false });
      }
    };
  }, [currentUserId, otherUserId]);

  // Render için server + pending birleşimi. Pending, kronolojik olarak
  // en sonda görünür (yeni yazılanlar).
  const messages = useMemo(() => [...serverMessages, ...pending], [serverMessages, pending]);

  const canSend = (draft.trim().length > 0 || !!selectedImage) && !isSending;

  const pickImage = async () => {
    const uri = await imageUploadService.pickCommentImage();
    if (uri) setSelectedImage(uri);
  };

  const removeImage = () => setSelectedImage(null);

  const send = async () => {
    const text = draft.trim();
    if ((!text && !selectedImage) || !currentUserId || !otherUserId) return;
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

    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localMsg: DirectMessage = {
      id: tempId,
      senderId: currentUserId,
      text,
      ...(image ? { image } : {}),
      createdAt: new Date(),
    };
    setPending((prev) => [...prev, localMsg]);

    // Optimistic: UI zaten güncellendi. Yazma arka planda; hatada pending'den
    // düşür (kullanıcı gönderilemediğini anlar — yeniden yazabilir).
    try {
      await messagingActions.send(currentUserId, otherUserId, text, image);
      // Server listener aynı mesajı kısa süre içinde bildirecek ve
      // pending'den düşürecek. Gecikirse fallback olarak 800ms sonra düşür.
      setTimeout(() => {
        setPending((prev) => prev.filter((m) => m.id !== tempId));
      }, 800);
    } catch {
      setPending((prev) => prev.filter((m) => m.id !== tempId));
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
  };
}

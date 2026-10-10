import { setTypingStatus } from '@/features/messaging/services/messagingService';
import { useCallback, useEffect, useRef } from 'react';

/** Aynı yazma seansında sunucuya bu sıklıktan daha sık damga yazılmaz. */
const WRITE_THROTTLE_MS = 3000;

/** Kendi "yazıyor" damgamızı kısıtlı sıklıkta yazar, çıkışta temizler. */
export function useTypingSignal(currentUserId?: string, otherUserId?: string) {
  const lastWriteAt = useRef(0);

  const stop = useCallback(() => {
    if (!currentUserId || !otherUserId) return;
    lastWriteAt.current = 0;
    setTypingStatus({ senderId: currentUserId, recipientId: otherUserId, isTyping: false });
  }, [currentUserId, otherUserId]);

  const ping = useCallback(() => {
    if (!currentUserId || !otherUserId) return;
    const now = Date.now();
    if (now - lastWriteAt.current <= WRITE_THROTTLE_MS) return;
    lastWriteAt.current = now;
    setTypingStatus({ senderId: currentUserId, recipientId: otherUserId, isTyping: true });
  }, [currentUserId, otherUserId]);

  useEffect(() => stop, [stop]);

  return { ping, stop };
}

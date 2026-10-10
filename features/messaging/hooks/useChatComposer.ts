import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import { toReplySnippet } from '@/features/messaging/utils/reply';
import i18n from '@/i18n';
import { uploadVoiceMessage } from '@/services/audio/upload';
import { imageUploadService } from '@/services/imageUploadService';
import { messagingActions } from '@/store/messagingStore';
import type { DirectMessage, MessageGif, MessageReply, VoiceMessage } from '@/types';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useReplyVisibility } from './useReplyVisibility';

type Params = {
  currentUserId?: string;
  otherUserId?: string;
  threadId?: string | null;
  messagingBlocked: boolean;
  addPending: (message: DirectMessage) => void;
  dropPending: (clientId: string) => void;
  stopTyping: () => void;
};

type Payload = {
  text: string;
  image?: string;
  voice?: VoiceMessage;
  gif?: MessageGif;
  viewOnce?: boolean;
  replyTo?: MessageReply;
};

const newClientId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Besteci: taslak metin, iliştirilen görsel, yanıt, tek seferlik ve ses kaydı. */
export function useChatComposer(params: Params) {
  const [draft, setDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [selectedReply, setReplyTo] = useState<MessageReply | null>(null);
  const [selectedEdit, setEditing] = useState<DirectMessage | null>(null);
  const replyVisible = useReplyVisibility(params.threadId || '', selectedReply?.id);
  const editVisible = useReplyVisibility(params.threadId || '', selectedEdit?.id);
  const replyTo = replyVisible ? selectedReply : null;
  const editing = editVisible ? selectedEdit : null;
  const [isSending, setIsSending] = useState(false);

  const { currentUserId, otherUserId, messagingBlocked } = params;
  const visibleDraft = selectedEdit && !editing ? '' : draft;
  const canSend = (visibleDraft.trim().length > 0 || !!selectedImage) && !isSending && !messagingBlocked;

  /** İyimser ekleme + arka planda yazma; hatada iyimser kopya geri alınır. */
  const deliver = useCallback((payload: Payload) => {
    if (!currentUserId || !otherUserId) return;
    const clientId = newClientId();
    params.addPending({
      id: clientId,
      clientId,
      senderId: currentUserId,
      text: payload.text,
      ...(payload.image ? { image: payload.image } : {}),
      ...(payload.voice ? { voice: payload.voice } : {}),
      ...(payload.gif ? { gif: payload.gif } : {}),
      ...(payload.viewOnce ? { viewOnce: true, openedAt: null } : {}),
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
      createdAt: new Date(),
      pending: true,
    });
    void messagingActions
      .send({ senderId: currentUserId, recipientId: otherUserId, clientId, ...payload })
      .catch(() => params.dropPending(clientId));
  }, [currentUserId, otherUserId, params]);

  /** Doğrulanmamış hesapta kurallar yazmayı reddeder: iyimser eklemeden ÖNCE bak. */
  const ensureAllowed = async () => {
    if (!currentUserId || !otherUserId || messagingBlocked) return false;
    const verified = await assertEmailVerified();
    if (!verified.ok) Alert.alert(i18n.t('common.error'), verified.error);
    return verified.ok;
  };

  /** İzin hataları çağıran tarafta değil BURADA gösterilir; seçici fırlatıyor. */
  const attach = async (source: 'library' | 'camera') => {
    try {
      const uri = source === 'camera'
        ? await imageUploadService.captureCommentImage()
        : await imageUploadService.pickCommentImage();
      if (uri) setSelectedImage(uri);
    } catch (error) {
      Alert.alert(i18n.t('common.error'), (error as Error).message);
    }
  };

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setViewOnce(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraft('');
  }, []);

  const send = async () => {
    if (selectedEdit && !editing) { cancelEdit(); return; }
    const text = draft.trim();
    // Düzenleme kipinde gönder tuşu yeni mesaj değil, mevcut metni günceller.
    if (editing) {
      if (!text || !params.threadId) return;
      try {
        await messagingActions.editMessage(params.threadId, editing.id, text);
        cancelEdit();
      } catch {
        // Yazılan metin korunur; kullanıcı tekrar deneyebilir.
        Alert.alert(i18n.t('common.error'), i18n.t('messages.editFailed'));
      }
      return;
    }
    if ((!text && !selectedImage) || !(await ensureAllowed())) return;

    const attachment = selectedImage;
    const once = viewOnce && !!attachment;
    const reply = replyTo ?? undefined;
    setDraft('');
    setSelectedImage(null);
    setViewOnce(false);
    setReplyTo(null);
    params.stopTyping();

    if (!attachment) {
      deliver({ text, replyTo: reply });
      return;
    }
    setIsSending(true);
    const image = await imageUploadService.uploadCommentImage(attachment).catch(() => null);
    setIsSending(false);
    if (image) deliver({ text, image, viewOnce: once, replyTo: reply });
  };

  /** Seçilen GIF/çıkartma anında gider; yükleme yok, Tenor adresi saklanır. */
  const sendGif = async (gif: MessageGif) => {
    if (!(await ensureAllowed())) return;
    const reply = replyTo ?? undefined;
    setReplyTo(null);
    deliver({ text: '', gif, replyTo: reply });
  };

  /** Kayıt biter bitmez gönderilir; sesli mesajda "taslak" diye bir şey yoktur. */
  const sendVoice = async ({ uri, durationMs }: { uri: string; durationMs: number }) => {
    if (!(await ensureAllowed())) return;
    const reply = replyTo ?? undefined;
    setReplyTo(null);
    setIsSending(true);
    try {
      const url = await uploadVoiceMessage(uri);
      deliver({ text: '', voice: { url, durationMs }, replyTo: reply });
    } catch (error) {
      Alert.alert(i18n.t('common.error'), (error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  return {
    draft: visibleDraft,
    setDraft: (text: string) => {
      if (selectedEdit && !editing) setEditing(null);
      setDraft(text);
    },
    canSend,
    send,
    sendGif,
    sendVoice,
    isSending,
    selectedImage,
    viewOnce,
    replyTo,
    editing,
    startEdit: useCallback((message: DirectMessage) => {
      setReplyTo(null);
      setEditing(message);
      setDraft(message.text);
    }, []),
    cancelEdit,
    startReply: useCallback((message: DirectMessage) => {
      setEditing(null);
      setReplyTo(toReplySnippet(message));
    }, []),
    cancelReply: useCallback(() => setReplyTo(null), []),
    toggleViewOnce: useCallback(() => setViewOnce(current => !current), []),
    pickImage: () => attach('library'),
    takePhoto: () => attach('camera'),
    removeImage,
  };
}

import ImageModal from '@/components/ui/ImageModal';
import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useChat } from '@/features/messaging/hooks/useChat';
import { useChatKeyboardInset } from '@/features/messaging/hooks/useChatKeyboardInset';
import { createChatStyles } from '@/features/messaging/styles/chatStyles';
import type { DirectMessage } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatComposer } from './ChatComposer';
import type { MessageActionHandlers } from '../MessageActions';
import { MessageInfoSheet } from '../MessageInfoSheet';
import { GifPickerSheet } from './GifPickerSheet';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';

export function ChatScreen({ threadId }: { threadId: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const chat = useChat(threadId);
  const styles = useMemo(() => createChatStyles(colors), [colors]);
  const [viewerImage, setViewerImage] = useReducer((_current: string | null, next: string | null) => next, null);
  const [gifPicker, setGifPicker] = useState(false);
  const [infoMessage, setInfoMessage] = useState<DirectMessage | null>(null);

  /** Herkesten silme geri alınamaz: önce sor. */
  const confirmDelete = useCallback((message: DirectMessage) => {
    Alert.alert(t('messages.deleteForEveryone'), t('messages.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => chat.deleteMessage(message.id) },
    ]);
  }, [chat, t]);
  const animatedBody = useChatKeyboardInset();
  const openProfile = useCallback(() => {
    if (chat.otherUser) router.push(`/user/${chat.otherUser.id}` as never);
  }, [chat.otherUser, router]);
  const openStory = useCallback((storyId: string) => router.push(`/story/${storyId}` as never), [router]);
  const closeViewer = useCallback(() => setViewerImage(null), []);
  /** Tek seferlik fotoğraf: açılış damgası düşer ve görsel tam ekran gösterilir. */
  const openViewOnce = useCallback((message: DirectMessage) => {
    if (!message.image) return;
    chat.openViewOnce(message.id);
    setViewerImage(message.image);
  }, [chat]);
  /** Mikrofon reddedilirse kullanıcı sebebini görmeli; sessizce düşmemeli. */
  const startRecording = useCallback(async () => {
    const started = await chat.voice.start();
    if (!started) Alert.alert(t('common.error'), t('messages.microphoneDenied'));
  }, [chat.voice, t]);
  const messageActions = useMemo<MessageActionHandlers>(() => ({
    onReply: chat.startReply,
    onEdit: chat.startEdit,
    onInfo: setInfoMessage,
    onHide: (message: DirectMessage) => chat.hideMessage(message.id),
    onDelete: (message: DirectMessage) => confirmDelete(message),
  }), [chat, confirmDelete]);

  const otherName = chat.otherUser?.displayName || chat.otherUser?.username;
  const replyAuthor = chat.replyTo?.senderId === chat.currentUserId
    ? t('messages.you')
    : otherName || t('common.user');

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <ChatHeader otherUser={chat.otherUser} presence={chat.presence} safeTop={top} styles={styles} onBack={router.back} onProfile={openProfile} />
      <Animated.View style={[styles.animatedBody, animatedBody]}>
        <ChatMessageList
          threadId={chat.threadId || ''}
          currentUserId={chat.currentUserId}
          deliveredUntil={chat.deliveredUntil}
          messages={chat.messages}
          otherName={otherName}
          otherTyping={chat.otherTyping}
          readUntil={chat.readUntil}
          styles={styles}
          onImagePress={setViewerImage}
          actions={messageActions}
          onOpenViewOnce={openViewOnce}
          onReply={chat.startReply}
          onStoryPress={openStory}
        />
        <ChatComposer
          blocked={chat.messagingBlocked}
          canSend={chat.canSend}
          draft={chat.draft}
          editing={chat.editing}
          isSending={chat.isSending}
          otherName={otherName}
          recording={chat.voice.isRecording}
          recordingMs={chat.voice.durationMs}
          replyAuthor={replyAuthor}
          replyTo={chat.replyTo}
          selectedImage={chat.selectedImage}
          styles={styles}
          viewOnce={chat.viewOnce}
          onCancelEdit={chat.cancelEdit}
          onCancelRecording={chat.voice.cancel}
          onCancelReply={chat.cancelReply}
          onDraftChange={chat.setDraft}
          onImagePick={chat.pickImage}
          onImageRemove={chat.removeImage}
          onOpenGifs={() => setGifPicker(true)}
          onTakePhoto={chat.takePhoto}
          onSend={chat.send}
          onSendRecording={chat.voice.send}
          onStartRecording={startRecording}
          onToggleViewOnce={chat.toggleViewOnce}
        />
      </Animated.View>
      <ImageModal visible={Boolean(viewerImage)} imageUri={viewerImage || ''} onClose={closeViewer} />
      <GifPickerSheet visible={gifPicker} onClose={() => setGifPicker(false)} onSelect={chat.sendGif} />
      <MessageInfoSheet
        message={infoMessage}
        deliveredUntil={chat.deliveredUntil}
        readUntil={chat.readUntil}
        onClose={() => setInfoMessage(null)}
      />
    </Screen>
  );
}

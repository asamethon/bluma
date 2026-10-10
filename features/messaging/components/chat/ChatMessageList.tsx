import { EmptyState } from '@/components/ui';
import type { ChatStyles } from '@/features/messaging/styles/chatStyles';
import { messageStatus } from '@/features/messaging/utils/status';
import { shouldShowStamp } from '@/features/messaging/utils/time';
import type { DirectMessage } from '@/types';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';
import { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageActionHandlers } from '../MessageActions';
import { MessageBubble } from '../MessageBubble';
import { MessageDissolve } from '../MessageDissolve';
import { SwipeToReply } from '../SwipeToReply';
import { TypingBubble } from '../TypingBubble';

type Props = {
  threadId: string;
  currentUserId?: string;
  deliveredUntil: number;
  messages: DirectMessage[];
  otherName?: string;
  otherTyping: boolean;
  readUntil: number;
  styles: ChatStyles;
  actions: MessageActionHandlers;
  onImagePress: (uri: string) => void;
  onOpenViewOnce: (message: DirectMessage) => void;
  onReply: (message: DirectMessage) => void;
  onStoryPress: (storyId: string) => void;
};

export const ChatMessageList = memo(function ChatMessageList(props: Props) {
  const { t } = useTranslation();
  const listRef = useRef<FlashListRef<DirectMessage>>(null);

  /** Alıntıya dokununca özgün mesaja gidilir; listede yoksa hiçbir şey olmaz. */
  const scrollToMessage = useCallback((messageId: string) => {
    const index = props.messages.findIndex(message => message.id === messageId);
    if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }, [props.messages]);

  const renderItem = useCallback(({ item, index }: { item: DirectMessage; index: number }) => {
    const previous = index > 0 ? props.messages[index - 1] : null;
    const mine = item.senderId === props.currentUserId;
    const quoteAuthor = item.replyTo?.senderId === props.currentUserId
      ? t('messages.you')
      : props.otherName || t('common.user');
    const status = mine ? messageStatus(item, props.deliveredUntil, props.readUntil) : undefined;
    const showStamp = shouldShowStamp(previous?.createdAt, item.createdAt);
    const firstInGroup = Boolean(previous && previous.senderId !== item.senderId);
    return (
      <MessageDissolve key={item.id} threadId={props.threadId} messageId={item.id} mine={mine}>
      <SwipeToReply message={item} onReply={props.onReply}>
        <MessageBubble
          threadId={props.threadId}
          actions={props.actions}
          message={item}
          mine={mine}
          quoteAuthor={quoteAuthor}
          status={status}
          showStamp={showStamp}
          firstInGroup={firstInGroup}
          onImagePress={props.onImagePress}
          onOpenViewOnce={props.onOpenViewOnce}
          onQuotePress={scrollToMessage}
          onStoryPress={props.onStoryPress}
        />
      </SwipeToReply>
      </MessageDissolve>
    );
  }, [props, scrollToMessage, t]);

  return (
    <FlashList
      ref={listRef}
      data={props.messages}
      keyExtractor={message => message.id}
      renderItem={renderItem}
      contentContainerStyle={props.styles.listContent}
      maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0.2, startRenderingFromBottom: true }}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews={false}
      ListFooterComponent={props.otherTyping ? <TypingBubble /> : null}
      ListEmptyComponent={props.otherTyping ? null : (
        <EmptyState icon="chatbubble-ellipses-outline" title={t('messages.sendFirstMessage')} compact />
      )}
    />
  );
});

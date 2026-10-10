import { Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { MessageActions, type MessageActionHandlers } from '@/features/messaging/components/MessageActions';
import { MessageMeta } from '@/features/messaging/components/MessageMeta';
import { MessageQuote } from '@/features/messaging/components/MessageQuote';
import { SharedStoryCard } from '@/features/messaging/components/SharedStoryCard';
import { ViewOnceContent } from '@/features/messaging/components/ViewOnceContent';
import { VoiceMessagePlayer } from '@/features/messaging/components/VoiceMessagePlayer';
import { formatMessageStamp } from '@/features/messaging/utils/time';
import type { DirectMessage, MessageGif, MessageStatus } from '@/types';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  threadId: string;
  message: DirectMessage;
  mine: boolean;
  status?: MessageStatus;
  showStamp: boolean;
  firstInGroup?: boolean;
  /** Alıntının başındaki isim — yanıtlanan mesajın sahibi. */
  quoteAuthor: string;
  /** Basılı tutunca açılan sistem menüsünün aksiyonları. */
  actions: MessageActionHandlers;
  onImagePress?: (uri: string) => void;
  onStoryPress?: (storyId: string) => void;
  onQuotePress?: (messageId: string) => void;
  onOpenViewOnce?: (message: DirectMessage) => void;
};

/** GIF baloncuğa sığar; çıkartma saydam olduğu için serbest durur. */
const sizeOf = (gif: MessageGif) => {
  const width = gif.sticker ? 148 : 210;
  const ratio = gif.width > 0 && gif.height > 0 ? gif.width / gif.height : 1;
  return { width, height: Math.max(90, Math.min(260, Math.round(width / ratio))) };
};

function MessageBubbleBase(props: Props) {
  const { colors, borders } = useTheme();
  const { message, mine } = props;
  const { image, story, replyTo, viewOnce, voice, gif } = message;
  const hasImageBody = !!image && !viewOnce;
  // Hikâye kartı ve çıkartma kendi başına durur: baloncuk zemini almazlar.
  const bare = !!story || !!gif?.sticker;
  if (message.deletedAt) return null;

  const quote = replyTo && (
    <MessageQuote threadId={props.threadId} reply={replyTo} mine={mine && !bare} authorName={props.quoteAuthor} onPress={props.onQuotePress} />
  );

  const skin = {
    paddingVertical: hasImageBody || gif ? 6 : 10,
    paddingHorizontal: hasImageBody || gif ? 6 : 14,
    backgroundColor: mine ? colors.primary : colors.surface,
    borderWidth: mine ? 0 : borders.thin,
    borderColor: colors.border,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderBottomLeftRadius: mine ? Radius.lg : Radius.xs,
    borderBottomRightRadius: mine ? Radius.xs : Radius.lg,
  };

  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginTop: props.showStamp ? 0 : props.firstInGroup ? 12 : 2 }}>
      {props.showStamp && (
        <Text variant="caption" color={colors.textLight} style={styles.stamp}>
          {formatMessageStamp(message.createdAt)}
        </Text>
      )}
      {/* Menü baloncuğun KENDİSİNİ sarar: iOS onu kaldırıp büyütür. */}
      <MessageActions message={message} mine={mine} handlers={props.actions}>
      {bare ? (
        <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
          {quote}
          {story && <SharedStoryCard story={story} mine={mine} onPress={props.onStoryPress} />}
          {gif && <Image source={{ uri: gif.url }} style={sizeOf(gif)} contentFit="contain" transition={140} />}
          <MessageMeta createdAt={message.createdAt} status={props.status} mine={mine} onBubble={false} />
        </View>
      ) : (
        <View style={[styles.bubble, skin]}>
          {replyTo && <View style={hasImageBody || gif ? styles.quoteInset : undefined}>{quote}</View>}
          {voice && <VoiceMessagePlayer voice={voice} mine={mine} />}
          {viewOnce && (
            <ViewOnceContent
              mine={mine}
              opened={!!message.openedAt}
              canOpen={!mine && !message.openedAt && !message.pending}
              onOpen={() => props.onOpenViewOnce?.(message)}
            />
          )}
          {gif && (
            <Image source={{ uri: gif.url }} style={[sizeOf(gif), styles.media]} contentFit="cover" transition={140} />
          )}
          {hasImageBody && (
            <Pressable onPress={() => props.onImagePress?.(image)}>
              <Image
                source={{ uri: image }}
                style={[styles.image, { marginBottom: message.text ? 6 : 0 }]}
                contentFit="cover"
              />
            </Pressable>
          )}
          {!!message.text && (
            <Text
              variant="body"
              color={mine ? colors.onPrimary : colors.text}
              style={[styles.text, hasImageBody && styles.textWithImage]}
            >
              {message.text}
            </Text>
          )}
          <View style={hasImageBody || gif ? styles.metaInset : undefined}>
            <MessageMeta
              createdAt={message.createdAt}
              status={props.status}
              mine={mine}
              edited={!!message.editedAt}
            />
          </View>
        </View>
      )}
      </MessageActions>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: { alignSelf: 'center', marginTop: 6, marginBottom: 10 },
  bubble: { maxWidth: '78%' },
  image: { width: 200, height: 200, borderRadius: Radius.md },
  media: { borderRadius: Radius.md },
  text: { fontSize: 14.5, lineHeight: 21 },
  textWithImage: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xs },
  quoteInset: { paddingHorizontal: Spacing.xs, paddingTop: Spacing.xs },
  metaInset: { paddingHorizontal: Spacing.sm },
});

export const MessageBubble = React.memo(MessageBubbleBase);

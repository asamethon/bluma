import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { MessageMeta } from '@/features/messaging/components/MessageMeta';
import { SharedStoryCard } from '@/features/messaging/components/SharedStoryCard';
import { formatMessageStamp } from '@/features/messaging/utils/time';
import { MessageStatus, SharedStory } from '@/types';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

function MessageBubbleBase({
  text,
  image,
  story,
  mine,
  status,
  showStamp,
  firstInGroup,
  stampTs,
  onImagePress,
  onStoryPress,
}: {
  text: string;
  image?: string;
  story?: SharedStory;
  mine: boolean;
  status?: MessageStatus;
  showStamp: boolean;
  firstInGroup?: boolean;
  stampTs?: any;
  onImagePress?: (uri: string) => void;
  onStoryPress?: (storyId: string) => void;
}) {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={{
        alignItems: mine ? 'flex-end' : 'flex-start',
        marginTop: showStamp ? 0 : firstInGroup ? 12 : 2,
      }}
    >
      {showStamp && (
        <Text
          variant="caption"
          color={colors.textLight}
          style={{ alignSelf: 'center', fontWeight: '600', marginTop: 6, marginBottom: 10 }}
        >
          {formatMessageStamp(stampTs)}
        </Text>
      )}
      {story ? (
        <View style={{ alignItems: 'flex-end' }}>
          <SharedStoryCard story={story} mine={mine} onPress={onStoryPress} />
          <MessageMeta createdAt={stampTs} status={status} mine={mine} onBubble={false} />
        </View>
      ) : (
      <View
        style={[
          {
            maxWidth: '78%',
            paddingVertical: image ? 6 : 10,
            paddingHorizontal: image ? 6 : 14,
            backgroundColor: mine ? colors.primary : colors.surfaceVariant,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderBottomLeftRadius: mine ? 18 : 4,
            borderBottomRightRadius: mine ? 4 : 18,
          },
          mine ? shadows.sm : null,
        ]}
      >
        {image && (
          <Pressable onPress={() => onImagePress?.(image)}>
            <Image
              source={{ uri: image }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 14,
                marginBottom: text ? 6 : 0,
              }}
              contentFit="cover"
            />
          </Pressable>
        )}
        {!!text && (
          <Text
            variant="body"
            color={mine ? colors.onPrimary : colors.text}
            style={{ fontSize: 14.5, lineHeight: 21, paddingHorizontal: image ? 8 : 0, paddingBottom: image ? 4 : 0 }}
          >
            {text}
          </Text>
        )}
        <View style={{ paddingHorizontal: image ? 8 : 0 }}>
          <MessageMeta createdAt={stampTs} status={status} mine={mine} />
        </View>
      </View>
      )}
    </View>
  );
}

export const MessageBubble = React.memo(MessageBubbleBase);

import { Avatar, Text } from '@/components/ui';
import { Motion, useTheme } from '@/constants/theme';
import { formatRelativeTime } from '@/features/story/utils/time';
import type { Conversation } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { createConversationDetailStyles } from '../styles/conversationDetailStyles';

type Props = {
  conversation: Conversation;
  liked: boolean;
  styles: ReturnType<typeof createConversationDetailStyles>;
  onLike: () => void;
  onImage: (uri: string) => void;
};

export function ConversationPost({ conversation, liked, styles, onLike, onImage }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.conversationHeader}>
      <View style={styles.authorInfo}>
        <Avatar
          uri={conversation.author?.profileImage}
          name={conversation.author?.displayName}
          size={40}
        />
        <View style={styles.authorDetails}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {conversation.author?.displayName || t('common.user')}
          </Text>
          <Text variant="caption" tone="textLight">{formatRelativeTime(conversation.createdAt)}</Text>
        </View>
      </View>

      <Text variant="bodyLg" style={styles.conversationContent}>{conversation.content}</Text>

      {conversation.image && (
        <Pressable
          onPress={() => onImage(conversation.image!)}
          style={({ pressed }) => ({ opacity: pressed ? Motion.pressOpacity : 1 })}
        >
          <Image source={{ uri: conversation.image }} style={styles.conversationImage} contentFit="contain" />
        </Pressable>
      )}

      <View style={styles.conversationStats}>
        <Pressable
          style={({ pressed }) => [styles.statItem, { opacity: pressed ? Motion.pressOpacity : 1 }]}
          onPress={onLike}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? colors.bloom : colors.textLight}
          />
          <Text variant="caption" color={liked ? colors.bloom : colors.textLight}>
            {conversation.likesCount || 0}
          </Text>
        </Pressable>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textLight} />
          <Text variant="caption" tone="textLight">{conversation.commentsCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={18} color={colors.textLight} />
          <Text variant="caption" tone="textLight">{conversation.viewsCount || 0}</Text>
        </View>
      </View>
    </View>
  );
}

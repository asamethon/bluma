import { Avatar, IconButton, Text } from '@/components/ui';
import { Motion, useTheme } from '@/constants/theme';
import { useOpenMention } from '@/features/mentions/hooks/useOpenMention';
import { renderMentionText } from '@/features/story/utils/mentionText';
import { formatRelativeTime } from '@/features/story/utils/time';
import type { ConversationComment } from '@/types';
import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { createConversationDetailStyles } from '../styles/conversationDetailStyles';

type Props = {
  item: ConversationComment;
  styles: ReturnType<typeof createConversationDetailStyles>;
  onImage: (uri: string) => void;
  /** Sil / şikâyet menüsü. */
  onMenu: (comment: ConversationComment) => void;
};

function ConversationCommentRowComponent({ item, styles, onImage, onMenu }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const openMention = useOpenMention();

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Avatar uri={item.user?.profileImage} name={item.user?.displayName} size={32} />
        <View style={styles.commentInfo}>
          <Text variant="labelSm" numberOfLines={1}>{item.user?.displayName || t('common.user')}</Text>
          <Text variant="caption" tone="textLight">{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <IconButton
          icon="ellipsis-horizontal"
          size={28}
          iconSize={16}
          color={colors.textLight}
          accessibilityLabel={t('common.more')}
          onPress={() => onMenu(item)}
        />
      </View>

      {!!item.content && (
        <Text variant="body" style={styles.commentContent}>
          {renderMentionText(item.content, colors.primary, openMention)}
        </Text>
      )}

      {item.image && (
        <Pressable
          onPress={() => onImage(item.image!)}
          style={({ pressed }) => ({ opacity: pressed ? Motion.pressOpacity : 1 })}
        >
          <Image source={{ uri: item.image }} style={styles.commentImage} contentFit="contain" />
        </Pressable>
      )}
    </View>
  );
}

export const ConversationCommentRow = memo(ConversationCommentRowComponent);

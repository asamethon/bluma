import { useTheme } from '@/constants/theme';
import { formatRelativeTime } from '@/features/story/utils/time';
import type { Comment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { createCommentsStyles } from '../../styles/commentsStyles';

type Props = {
  comment: Comment;
  currentUserId?: string;
  level?: number;
  styles: ReturnType<typeof createCommentsStyles>;
  onLike: (id: string) => void;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (comment: Comment) => void;
};

function CommentItemComponent({ comment, currentUserId, level = 0, styles, ...actions }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[styles.commentItem, { marginLeft: level * 20 }]}>
      <View style={styles.commentHeader}>
        <TouchableOpacity style={styles.userAvatar} onPress={() => router.push(`/user/${comment.user.id}` as never)}>
          {comment.user.profileImage ? (
            <Image source={{ uri: comment.user.profileImage }} style={styles.userAvatarImage} />
          ) : (
            <Ionicons name="person" size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.commentInfo}>
          <Text style={styles.userName}>{comment.user.displayName}</Text>
          <Text style={styles.userHandle}>@{comment.user.username || 'user'}</Text>
        </View>
        <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction} onPress={() => actions.onLike(comment.id)}>
          <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.actionText}>{comment.likesCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction} onPress={() => actions.onReply(comment.id)}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.actionText}>{t('commentsScreen.reply')}</Text>
        </TouchableOpacity>
        {currentUserId === comment.user.id ? (
          <TouchableOpacity style={styles.commentAction} onPress={() => actions.onDelete(comment.id)}>
            <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.commentAction} onPress={() => actions.onReport(comment)}>
            <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>{t('report.report')}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!comment.replies?.length && (
        <View style={styles.repliesContainer}>
          {comment.replies.map(reply => (
            <CommentItemComponent
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              level={level + 1}
              styles={styles}
              {...actions}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export const CommentItem = memo(CommentItemComponent);

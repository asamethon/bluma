import ReportSheet from '@/features/moderation/components/ReportSheet';
import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useComments } from '@/features/story/hooks/useComments';
import type { Comment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCommentsStyles } from '../../styles/commentsStyles';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import { CommentsHeader } from './CommentsHeader';

type Props = { storyId: string; chapter?: string };

const findAuthorName = (comments: Comment[], id: string | null): string | undefined => {
  if (!id) return undefined;
  return comments.reduce<string | undefined>((found, comment) => (
    found || (comment.id === id ? comment.user.displayName : findAuthorName(comment.replies || [], id))
  ), undefined);
};

export function CommentsScreen({ storyId, chapter }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const chapterIndex = chapter === undefined ? undefined : Number.parseInt(chapter, 10) || 0;
  const comments = useComments(storyId, chapterIndex);
  const { report: reportComment } = comments;
  const styles = useMemo(() => createCommentsStyles(colors), [colors]);
  const back = () => router.canGoBack() ? router.back() : router.push(`/story/${storyId}/preview` as never);
  const report = useCallback((comment: Comment) => reportComment({
    targetId: comment.id,
    reportedUserId: comment.user.id,
  }), [reportComment]);
  const renderComment = useCallback<ListRenderItem<Comment>>(({ item }) => (
    <CommentItem
      comment={item}
      currentUserId={comments.currentUser?.id}
      styles={styles}
      onLike={comments.like}
      onReply={comments.setReplyingTo}
      onDelete={comments.remove}
      onReport={report}
    />
  ), [comments.currentUser?.id, comments.like, comments.remove, comments.setReplyingTo, report, styles]);

  return (
    // Alt güvenli alan boşluğunu yazma alanı verir (bkz. useKeyboardLift).
    <Screen edges={[]} style={styles.container}>
      <CommentsHeader
        count={comments.visible.length}
        safeTop={top}
        chapterIndex={chapterIndex}
        filterChapter={comments.filterChapter}
        styles={styles}
        onBack={back}
        onFilter={comments.setFilterChapter}
      />
      <FlashList
        data={comments.visible}
        keyExtractor={item => item.id}
        renderItem={renderComment}
        style={styles.commentsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>{t('comments.emptyTitle')}</Text>
            <Text style={styles.emptyStateMessage}>{t('commentsScreen.emptyMessage')}</Text>
          </View>
        }
        ListFooterComponent={comments.hasMore ? (
          <TouchableOpacity style={styles.loadMoreButton} onPress={comments.loadMore}>
            <Text style={styles.loadMoreText}>{t('commentsScreen.loadMore')}</Text>
          </TouchableOpacity>
        ) : null}
      />
      <CommentComposer
        user={comments.currentUser}
        content={comments.content}
        replyingToName={findAuthorName(comments.comments, comments.replyingTo)}
        submitting={comments.submitting}
        styles={styles}
        onChange={comments.setContent}
        onCancelReply={() => comments.setReplyingTo(null)}
        onSubmit={comments.submit}
      />
      <ReportSheet
        visible={!!comments.reportTarget}
        onClose={comments.closeReport}
        target={comments.reportTarget ? {
          type: 'comment',
          targetId: comments.reportTarget.targetId,
          reportedUserId: comments.reportTarget.reportedUserId,
          contextId: storyId,
        } : null}
      />
    </Screen>
  );
}

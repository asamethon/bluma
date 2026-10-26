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
import { useEffect, useRef, useState } from 'react';
import { CommentMentionList } from './CommentMentionList';
import { searchUsers } from '@/features/search/services/userSearch';
import type { User } from '@/types';

type Props = { storyId: string; chapter?: string; commentId?: string };

const findAuthorName = (comments: Comment[], id: string | null): string | undefined => {
  if (!id) return undefined;
  return comments.reduce<string | undefined>((found, comment) => (
    found || (comment.id === id ? comment.user.displayName : findAuthorName(comment.replies || [], id))
  ), undefined);
};

export function CommentsScreen({ storyId, chapter, commentId }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<any>(null);
  const chapterIndex = chapter === undefined ? undefined : Number.parseInt(chapter, 10) || 0;
  const comments = useComments(storyId, chapterIndex);
  const { report: reportComment } = comments;
  const styles = useMemo(() => createCommentsStyles(colors), [colors]);
  const [autoHighlighted, setAutoHighlighted] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const mentionQueryRef = useRef('');
  const mentionTimeoutRef = useRef<any>(null);
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
      highlight={(commentId === item.id) || (autoHighlighted === item.id)}
    />
  ), [comments.currentUser?.id, comments.like, comments.remove, comments.setReplyingTo, report, styles, commentId, autoHighlighted]);

  useEffect(() => {
    const targetId = commentId || autoHighlighted;
    if (!targetId || comments.visible.length === 0) return;
    const index = comments.visible.findIndex((item: any) => item.id === targetId);
    if (index >= 0 && listRef.current) {
      try {
        listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
      } catch {}
    }
  }, [commentId, autoHighlighted, comments.visible]);

  useEffect(() => {
    if (commentId || autoHighlighted) return;
    const currentUsername = comments.currentUser?.username?.toLowerCase();
    if (!currentUsername || comments.visible.length === 0) return;
    const mentionRegex = new RegExp(`@${currentUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    for (const item of comments.visible as any[]) {
      if (mentionRegex.test(item.content || '')) {
        setAutoHighlighted(item.id);
        break;
      }
      if (item.replies?.length) {
        for (const reply of item.replies) {
          if (mentionRegex.test(reply.content || '')) {
            setAutoHighlighted(reply.id);
            break;
          }
        }
        if (autoHighlighted) break;
      }
    }
  }, [comments.currentUser?.username, comments.visible, commentId, autoHighlighted]);

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
        ref={listRef}
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
      <View style={{ position: 'relative', zIndex: 100000, elevation: 100000 }}>
        <CommentMentionList
          suggestions={mentionSuggestions}
          visible={showMentionSuggestions}
          onSelect={(username) => {
            if (!username) return;
            const query = mentionQueryRef.current;
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const newContent = comments.content.replace(new RegExp(`@${escaped}$`), `@${username} `);
            comments.setContent(newContent);
            setShowMentionSuggestions(false);
            setMentionSuggestions([]);
            mentionQueryRef.current = '';
          }}
        />
        <CommentComposer
          user={comments.currentUser}
          content={comments.content}
          replyingToName={findAuthorName(comments.comments, comments.replyingTo)}
          submitting={comments.submitting}
          styles={styles}
          onChange={(value: string) => {
            console.log('[MENTION] change', value);
            comments.setContent(value);
            const match = value.match(/@([a-zA-Z0-9_]*)$/);
            if (match) {
              const query = match[1] || '';
              console.log('[MENTION] match', query);
              mentionQueryRef.current = query;
              setShowMentionSuggestions(true);
              if (mentionTimeoutRef.current) clearTimeout(mentionTimeoutRef.current);
              mentionTimeoutRef.current = setTimeout(async () => {
                try {
                  console.log('[MENTION] searching', query);
                  const results = await searchUsers(query);
                  console.log('[MENTION] results', results.length);
                  setMentionSuggestions(results.slice(0, 6));
                } catch (e) {
                  console.log('[MENTION] err', e);
                  setMentionSuggestions([]);
                }
              }, 20);
            } else {
              console.log('[MENTION] no match');
              setShowMentionSuggestions(false);
              setMentionSuggestions([]);
              mentionQueryRef.current = '';
              if (mentionTimeoutRef.current) clearTimeout(mentionTimeoutRef.current);
            }
          }}
          onCancelReply={() => comments.setReplyingTo(null)}
          onSubmit={() => {
            setShowMentionSuggestions(false);
            setMentionSuggestions([]);
            comments.submit();
          }}
        />
      </View>
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

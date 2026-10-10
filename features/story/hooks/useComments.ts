import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import type { Comment } from '@/types';

const EMPTY_COMMENTS: Comment[] = [];

export type ReportTarget = { targetId: string; reportedUserId?: string } | null;
type State = {
  content: string;
  replyingTo: string | null;
  submitting: boolean;
  reportTarget: ReportTarget;
  filterChapter: boolean;
};
type Action =
  | { type: 'content'; value: string }
  | { type: 'reply'; value: string | null }
  | { type: 'submitting'; value: boolean }
  | { type: 'report'; value: ReportTarget }
  | { type: 'filter'; value: boolean }
  | { type: 'submitted' };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'content') return { ...state, content: action.value };
  if (action.type === 'reply') return { ...state, replyingTo: action.value };
  if (action.type === 'submitting') return { ...state, submitting: action.value };
  if (action.type === 'report') return { ...state, reportTarget: action.value };
  if (action.type === 'filter') return { ...state, filterChapter: action.value };
  return { ...state, content: '', replyingTo: null };
};

export function useComments(storyId: string, chapterIndex?: number) {
  const { t } = useTranslation();
  const currentUser = useAppSelector(state => state.auth.user);
  const comments = useAppSelector(state => state.story.storyComments) || EMPTY_COMMENTS;
  const hasMore = useAppSelector(state => state.story.storyCommentsHasMore);
  const [state, dispatch] = useReducer(reducer, {
    content: '', replyingTo: null, submitting: false, reportTarget: null,
    filterChapter: chapterIndex !== undefined,
  });

  useEffect(() => {
    storyActions.setupCommentsListener(storyId);
    return storyActions.cleanupCommentsListener;
  }, [storyId]);

  const visible = useMemo(() => state.filterChapter && chapterIndex !== undefined
    ? comments.filter(comment => comment.chapterIndex === chapterIndex)
    : comments, [chapterIndex, comments, state.filterChapter]);

  const requireUser = useCallback((messageKey: string) => {
    if (currentUser?.id) return true;
    Alert.alert(t('studio.loginRequiredTitle'), t(messageKey));
    return false;
  }, [currentUser?.id, t]);

  const like = useCallback((commentId: string) => {
    if (!requireUser('commentsScreen.actionLoginRequired')) return;
    void storyActions.likeComment(storyId, commentId).catch(error => logger.error('Like comment error:', error));
  }, [requireUser, storyId]);

  const remove = useCallback((commentId: string) => Alert.alert(
    t('commentsScreen.deleteTitle'),
    t('commentsScreen.deleteConfirm'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: () => {
          void storyActions.deleteComment(storyId, commentId).catch(error => logger.error('Delete comment error:', error));
        },
      },
    ],
  ), [storyId, t]);

  const submit = useCallback(async () => {
    if (!state.content.trim() || !requireUser('commentsScreen.commentLoginRequired')) return;
    dispatch({ type: 'submitting', value: true });
    try {
      const result = await storyActions.addComment(
        storyId, state.content, state.replyingTo || undefined, chapterIndex,
      );
      if (result.success) dispatch({ type: 'submitted' });
      else Alert.alert(t('common.error'), result.error || t('conversations.commentFailed'));
    } catch (error) {
      logger.error('Submit comment error:', error);
      Alert.alert(t('common.error'), t('conversations.commentFailed'));
    } finally {
      dispatch({ type: 'submitting', value: false });
    }
  }, [chapterIndex, requireUser, state.content, state.replyingTo, storyId, t]);

  const closeReport = useCallback(() => dispatch({ type: 'report', value: null }), []);
  const report = useCallback((value: Exclude<ReportTarget, null>) => dispatch({ type: 'report', value }), []);
  const setContent = useCallback((value: string) => dispatch({ type: 'content', value }), []);
  const setFilterChapter = useCallback((value: boolean) => dispatch({ type: 'filter', value }), []);
  const setReplyingTo = useCallback((value: string | null) => dispatch({ type: 'reply', value }), []);

  return {
    ...state,
    comments,
    currentUser,
    hasMore,
    visible,
    closeReport,
    loadMore: storyActions.loadMoreComments,
    like,
    remove,
    report,
    setContent,
    setFilterChapter,
    setReplyingTo,
    submit,
  };
}

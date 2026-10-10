import { imageUploadService } from '@/services/imageUploadService';
import { conversationActions } from '@/store/conversationStore';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type State = { comment: string; image: string | null; modalImage: string | null; submitting: boolean };
type Action =
  | { type: 'comment'; value: string }
  | { type: 'image'; value: string | null }
  | { type: 'modal'; value: string | null }
  | { type: 'submitting'; value: boolean }
  | { type: 'submitted' };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'comment') return { ...state, comment: action.value };
  if (action.type === 'image') return { ...state, image: action.value };
  if (action.type === 'modal') return { ...state, modalImage: action.value };
  if (action.type === 'submitting') return { ...state, submitting: action.value };
  return { ...state, comment: '', image: null };
};

export function useConversationDetail(conversationId: string) {
  const { t } = useTranslation();
  const currentUser = useAppSelector(state => state.auth.user);
  const conversation = useAppSelector(state => state.conversation.currentConversation);
  const comments = useAppSelector(state => state.conversation.currentConversationComments);
  const liked = useAppSelector(state => state.conversation.likedConversationIds.includes(conversationId));
  const [state, dispatch] = useReducer(reducer, { comment: '', image: null, modalImage: null, submitting: false });
  const userId = currentUser?.id;

  useEffect(() => {
    const lifecycle = { active: true };
    const subscriptions: (() => void)[] = [];
    void conversationActions.getConversationById(conversationId);
    const keepSubscription = (unsubscribe?: () => void) => {
      if (!unsubscribe) return;
      if (lifecycle.active) subscriptions.push(unsubscribe);
      else unsubscribe();
    };
    void conversationActions.getConversationRealTimeUpdates(conversationId).then(keepSubscription);
    void conversationActions.getConversationComments(conversationId).then(keepSubscription);
    if (userId) void conversationActions.getLikedConversations(userId);
    return () => {
      lifecycle.active = false;
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [conversationId, userId]);

  const pickImage = useCallback(() => {
    void imageUploadService.pickCommentImage().then(image => {
      if (image) dispatch({ type: 'image', value: image });
    }).catch(error => {
      logger.error('Error selecting image:', error);
      Alert.alert(t('common.error'), t('imageUpload.pickError'));
    });
  }, [t]);

  const submit = useCallback(async () => {
    if (!userId) return Alert.alert(t('common.error'), t('errors.userNotFound'));
    if (!state.comment.trim() && !state.image) return Alert.alert(t('common.error'), t('comments.writeOrAttach'));
    dispatch({ type: 'submitting', value: true });
    try {
      const image = state.image ? await imageUploadService.uploadCommentImage(state.image) : undefined;
      const result = await conversationActions.addComment(conversationId, state.comment.trim(), image);
      if (result.success) dispatch({ type: 'submitted' });
      else Alert.alert(t('common.error'), result.error || t('conversations.commentFailed'));
    } catch (error) {
      logger.error('Add comment error:', error);
      Alert.alert(t('common.error'), t('conversations.commentFailed'));
    } finally {
      dispatch({ type: 'submitting', value: false });
    }
  }, [conversationId, state.comment, state.image, t, userId]);

  const closeModal = useCallback(() => dispatch({ type: 'modal', value: null }), []);
  const like = useCallback(() => { void conversationActions.likeConversation(conversationId); }, [conversationId]);
  const openModal = useCallback((value: string) => dispatch({ type: 'modal', value }), []);
  const removeImage = useCallback(() => dispatch({ type: 'image', value: null }), []);
  const setComment = useCallback((value: string) => dispatch({ type: 'comment', value }), []);

  return {
    ...state,
    comments,
    conversation,
    currentUser,
    liked,
    closeModal,
    like,
    openModal,
    pickImage,
    removeImage,
    setComment,
    submit,
  };
}

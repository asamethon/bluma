import { imageUploadService } from '@/services/imageUploadService';
import { conversationActions } from '@/store/conversationStore';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type FormState = {
  announce: boolean;
  content: string;
  image: string | null;
  submitting: boolean;
  title: string;
};

const initialState: FormState = { announce: false, content: '', image: null, submitting: false, title: '' };
const reducer = (state: FormState, patch: Partial<FormState>): FormState => ({ ...state, ...patch });

export function useCreateConversation() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const [form, patch] = useReducer(reducer, initialState);
  const setTitle = useCallback((title: string) => patch({ title }), []);
  const setContent = useCallback((content: string) => patch({ content }), []);
  const toggleAnnounce = useCallback(() => patch({ announce: !form.announce }), [form.announce]);
  const removeImage = useCallback(() => patch({ image: null }), []);
  const pickImage = useCallback(() => {
    void imageUploadService.pickCommentImage().then(uri => {
      if (uri) return imageUploadService.uploadCommentImage(uri);
      return null;
    }).then(image => {
      if (image) patch({ image });
    }).catch(error => {
      logger.error('Error selecting image:', error);
      Alert.alert(t('common.error'), t('imageUpload.pickError'));
    });
  }, [t]);
  const cancel = useCallback(() => {
    if (!form.title.trim() && !form.content.trim()) {
      router.back();
      return;
    }
    Alert.alert(t('conversations.exitTitle'), t('conversations.exitConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('conversations.exit'), style: 'destructive', onPress: router.back },
    ]);
  }, [form.content, form.title, router, t]);
  const submit = useCallback(() => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('errors.userNotFound'));
      return;
    }
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content) {
      Alert.alert(t('common.error'), t(title ? 'conversations.enterContent' : 'conversations.enterTitle'));
      return;
    }
    patch({ submitting: true });
    void conversationActions.createConversation({
      authorId: user.id,
      author: user,
      title,
      content,
      image: form.image || undefined,
      isActive: true,
    }).then(result => {
      if (!result.success || !result.conversationId) {
        Alert.alert(t('common.error'), result.error || t('conversations.createFailed'));
        return;
      }
      if (form.announce) {
        void conversationActions.announceConversationToFollowers(result.conversationId, user)
          .catch(error => logger.error('Error sending announcement to followers:', error));
      }
      Alert.alert(
        t('common.success'),
        t(form.announce ? 'conversations.createdAnnounced' : 'conversations.created'),
        [{ text: t('common.ok'), onPress: () => {
          router.back();
          void conversationActions.getUserConversations(user.id);
        } }],
      );
    }).catch(error => {
      logger.error('Create conversation error:', error);
      Alert.alert(t('common.error'), t('conversations.createFailed'));
    }).finally(() => patch({ submitting: false }));
  }, [form, router, t, user]);

  return {
    ...form,
    canSubmit: Boolean(form.title.trim() && form.content.trim() && !form.submitting),
    cancel,
    pickImage,
    removeImage,
    setContent,
    setTitle,
    submit,
    toggleAnnounce,
  };
}

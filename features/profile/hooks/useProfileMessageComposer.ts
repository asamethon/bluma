import { useMentionAutocomplete } from '@/features/mentions/hooks/useMentionAutocomplete';
import { imageUploadService } from '@/services/imageUploadService';
import { conversationActions } from '@/store/conversationStore';
import type { User } from '@/types';
import { useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type State = { content: string; image: string | null; notify: boolean; posting: boolean };
type Action =
  | { type: 'content'; value: string }
  | { type: 'image'; value: string | null }
  | { type: 'notify' }
  | { type: 'posting'; value: boolean }
  | { type: 'reset' };

const initialState: State = { content: '', image: null, notify: false, posting: false };
const reducer = (state: State, action: Action): State => {
  if (action.type === 'content') return { ...state, content: action.value };
  if (action.type === 'image') return { ...state, image: action.value };
  if (action.type === 'notify') return { ...state, notify: !state.notify };
  if (action.type === 'posting') return { ...state, posting: action.value };
  return initialState;
};

/**
 * Profil panosuna mesaj bırakma akışı. `boardOwner` verildiyse gönderi
 * BAŞKASININ panosuna gider: `boardOwnerId` o kişi olur ve "takipçilere duyur"
 * seçeneği hiç gösterilmez (duyuru yalnızca kendi gönderisi için anlamlı).
 */
export function useProfileMessageComposer(user: User, boardOwner: User | undefined, onDone: () => void) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const setContent = useCallback((value: string) => dispatch({ type: 'content', value }), []);
  // Pano sahibi öneri listesinin başında durur; etiket bildirimi
  // createConversation içindeki notifyConversationMentions ile gider.
  const mentions = useMentionAutocomplete(state.content, setContent, boardOwner ? [boardOwner] : []);

  const close = useCallback(() => {
    dispatch({ type: 'reset' });
    onDone();
  }, [onDone]);

  const pickImage = useCallback(() => {
    void imageUploadService.pickCommentImage().then(image => {
      if (image) dispatch({ type: 'image', value: image });
    }).catch(error => {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('imageUpload.pickError'));
    });
  }, [t]);

  const post = useCallback(async () => {
    if (!state.content.trim()) return Alert.alert(t('profileScreen.warning'), t('profileScreen.writeMessageFirst'));
    dispatch({ type: 'posting', value: true });
    try {
      // Görsel yüklenemezse (moderasyon reddi dahil) gönderim DURUR: sessizce
      // görselsiz paylaşmak kullanıcının gönderdiğini değiştirmek olurdu.
      const image = state.image ? await imageUploadService.uploadCommentImage(state.image) : undefined;
      const result = await conversationActions.createConversation({
        title: '',
        content: state.content.trim(),
        authorId: user.id,
        author: user,
        isActive: true,
        boardOwnerId: boardOwner?.id ?? user.id,
        ...(image ? { image } : {}),
      });
      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('profileScreen.messageShareFailed'));
        return;
      }
      if (!boardOwner && state.notify && result.conversationId) {
        void conversationActions.announceConversationToFollowers(result.conversationId, user);
      }
      Alert.alert(t('common.success'), t(boardOwner ? 'profileScreen.boardMessageShared' : 'profileScreen.messageShared'));
      close();
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('profileScreen.messageShareFailed'));
    } finally {
      dispatch({ type: 'posting', value: false });
    }
  }, [boardOwner, close, state.content, state.image, state.notify, t, user]);

  return {
    ...state,
    mentions,
    canPost: !!state.content.trim() && !state.posting,
    close,
    pickImage,
    post,
    removeImage: useCallback(() => dispatch({ type: 'image', value: null }), []),
    setContent,
    toggleNotify: useCallback(() => dispatch({ type: 'notify' }), []),
  };
}

import { Screen, Text } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { imageUploadService } from '@/services/imageUploadService';
import { conversationActions } from '@/store/conversationStore';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';

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

type Props = { visible: boolean; user: User; onClose: () => void };

export function ProfileMessageComposer({ visible, user, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const close = () => {
    dispatch({ type: 'reset' });
    onClose();
  };
  const pickImage = async () => {
    try {
      const image = await imageUploadService.pickCommentImage();
      if (image) dispatch({ type: 'image', value: image });
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('imageUpload.pickError'));
    }
  };
  const post = async () => {
    if (!state.content.trim()) return Alert.alert(t('profileScreen.warning'), t('profileScreen.writeMessageFirst'));
    dispatch({ type: 'posting', value: true });
    try {
      const image = state.image
        ? await imageUploadService.uploadCommentImage(state.image).catch(() => undefined)
        : undefined;
      const result = await conversationActions.createConversation({
        title: '',
        content: state.content.trim(),
        authorId: user.id,
        author: user,
        isActive: true,
        ...(image ? { image } : {}),
      });
      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('profileScreen.messageShareFailed'));
        return;
      }
      if (state.notify && result.conversationId) {
        void conversationActions.announceConversationToFollowers(result.conversationId, user);
      }
      Alert.alert(t('common.success'), t('profileScreen.messageShared'));
      close();
    } catch {
      Alert.alert(t('common.error'), t('profileScreen.messageShareFailed'));
    } finally {
      dispatch({ type: 'posting', value: false });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <Screen style={{ flex: 1, backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={close}><Text variant="body" tone="textSecondary">{t('common.cancel')}</Text></TouchableOpacity>
          <Text variant="subheading">{t('profileScreen.shareMessage')}</Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary, opacity: !state.content.trim() || state.posting ? 0.5 : 1 }]}
            onPress={post}
            disabled={!state.content.trim() || state.posting}
          >
            {state.posting ? <ActivityIndicator size="small" color="#fff" /> : <Text variant="label" color="#fff">{t('messages.share')}</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.composerBody}>
          <TextInput
            style={[styles.msgInput, { color: colors.text, borderBottomColor: colors.border }]}
            placeholder={t('profileScreen.messagePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={state.content}
            onChangeText={value => dispatch({ type: 'content', value })}
            multiline autoFocus maxLength={500}
          />
          {state.image && (
            <View style={styles.composerImageWrap}>
              <Image source={{ uri: state.image }} style={styles.composerImage} contentFit="cover" />
              <TouchableOpacity style={styles.removeImage} onPress={() => dispatch({ type: 'image', value: null })}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.surface }]} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text variant="label" tone="primary">{t('profileScreen.addPhoto')}</Text>
          </TouchableOpacity>
          <View style={[styles.notifyRow, { backgroundColor: colors.surface }]}>
            <View style={styles.notifyCopy}>
              <Text variant="label" style={styles.notifyTitle}>{t('profileScreen.announceToFollowers')}</Text>
              <Text variant="caption" tone="textSecondary">{t('profileScreen.announceToFollowersSub')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: state.notify ? colors.primary : colors.border }]}
              onPress={() => dispatch({ type: 'notify' })}
            >
              <View style={[styles.toggleThumb, state.notify && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    </Modal>
  );
}

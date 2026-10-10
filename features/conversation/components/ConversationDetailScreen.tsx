import ImageModal from '@/components/ui/ImageModal';
import { PageHeader, Screen } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { useConversationDetail } from '@/features/conversation/hooks/useConversationDetail';
import type { ConversationComment } from '@/types';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { createConversationDetailStyles } from '../styles/conversationDetailStyles';
import { ConversationCommentComposer } from './ConversationCommentComposer';
import { ConversationCommentRow } from './ConversationCommentRow';
import { ConversationPost } from './ConversationPost';

export function ConversationDetailScreen({ conversationId }: { conversationId: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const state = useConversationDetail(conversationId);
  const styles = useMemo(() => createConversationDetailStyles(colors), [colors]);
  const renderComment = useCallback<ListRenderItem<ConversationComment>>(({ item }) => (
    <ConversationCommentRow item={item} styles={styles} onImage={state.openModal} />
  ), [state.openModal, styles]);

  if (!state.conversation) {
    return (
      <Screen style={styles.container} maxContentWidth={ContentMaxWidth.content}>
        <View style={styles.loadingContainer}><Text style={styles.loadingText}>{t('conversations.loading')}</Text></View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} maxContentWidth={ContentMaxWidth.content}>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <PageHeader title={t('conversations.conversation')} onBack={router.back} />
        <FlashList
          data={state.comments || []}
          renderItem={renderComment}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <ConversationPost
              conversation={state.conversation}
              liked={state.liked}
              styles={styles}
              onLike={state.like}
              onImage={state.openModal}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCommentsContainer}>
              <Text style={styles.emptyCommentsText}>{t('comments.emptyTitle')}</Text>
              <Text style={styles.emptyCommentsSubtext}>{t('comments.emptySub')}</Text>
            </View>
          }
        />
        <ConversationCommentComposer
          text={state.comment}
          image={state.image}
          submitting={state.submitting}
          styles={styles}
          onChange={state.setComment}
          onPickImage={state.pickImage}
          onRemoveImage={state.removeImage}
          onSubmit={state.submit}
        />
      </KeyboardAvoidingView>
      <ImageModal visible={!!state.modalImage} imageUri={state.modalImage || ''} onClose={state.closeModal} />
    </Screen>
  );
}

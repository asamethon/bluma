import ImageModal from '@/components/ui/ImageModal';
import { IconButton, PageHeader, Screen } from '@/components/ui';
import ReportSheet from '@/features/moderation/components/ReportSheet';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { useConversationCommentActions } from '@/features/conversation/hooks/useConversationCommentActions';
import { useConversationDetail } from '@/features/conversation/hooks/useConversationDetail';
import { MentionSuggestions } from '@/features/mentions/components/MentionSuggestions';
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
  const commentActions = useConversationCommentActions(state.conversation, state.comments ?? []);
  const styles = useMemo(() => createConversationDetailStyles(colors), [colors]);
  // Kendi gönderisini kimse şikâyet etmez.
  const canReport = !!state.conversation
    && !!state.currentUser
    && state.conversation.authorId !== state.currentUser.id;
  const renderComment = useCallback<ListRenderItem<ConversationComment>>(({ item }) => (
    <ConversationCommentRow item={item} styles={styles} onImage={state.openModal} onMenu={commentActions.open} />
  ), [commentActions.open, state.openModal, styles]);

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
        <PageHeader
          title={t('conversations.conversation')}
          onBack={router.back}
          right={canReport ? (
            <IconButton
              icon="flag-outline"
              size={36}
              accessibilityLabel={t('report.targetConversation')}
              onPress={state.openReport}
            />
          ) : undefined}
        />
        <FlashList
          data={commentActions.comments}
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
        <MentionSuggestions suggestions={state.mentions.suggestions} onSelect={state.mentions.select} />
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
      <ReportSheet
        visible={!!commentActions.reportTarget}
        onClose={commentActions.closeReport}
        target={commentActions.reportTarget ? { type: 'comment', ...commentActions.reportTarget, contextId: conversationId } : null}
      />
      <ReportSheet
        visible={state.reportVisible}
        onClose={state.closeReport}
        target={{
          type: 'conversation',
          targetId: conversationId,
          reportedUserId: state.conversation.authorId,
        }}
      />
    </Screen>
  );
}

import { canDeleteBoardPost } from '@/features/conversation/utils/boardPost';
import { deleteConversationComment } from '@/features/conversation/services/conversationComments';
import { useAppSelector } from '@/store/hooks';
import type { Conversation, ConversationComment } from '@/types';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type ReportTarget = { targetId: string; reportedUserId: string };

/**
 * Yorum satırının menüsü. Silme yorumu YAZANA ve konuşmanın sahibine açıktır
 * (yazar ya da pano sahibi — kuraldaki `ownsConversation` ile aynı koşul);
 * şikâyet yalnızca başkasının yorumunda görünür.
 *
 * Silme iyimserdir: satır anında kaybolur, hata olursa geri gelir. Dinleyici
 * zaten sunucu gerçeğini taşıdığı için gizleme yerel bir süzgeçtir.
 */
export function useConversationCommentActions(
  conversation: Conversation | null,
  comments: ConversationComment[],
) {
  const { t } = useTranslation();
  const viewerId = useAppSelector(state => state.auth.user?.id);
  const [hidden, setHidden] = useState<string[]>([]);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const ownsConversation = !!conversation && canDeleteBoardPost(conversation, viewerId);
  const visible = useMemo(
    () => comments.filter(comment => !hidden.includes(comment.id)),
    [comments, hidden],
  );

  const remove = useCallback((comment: ConversationComment) => {
    if (!conversation) return;
    const branch = [comment.id, ...comments.filter(item => item.parentId === comment.id).map(item => item.id)];
    setHidden(current => [...current, ...branch]);
    void deleteConversationComment(conversation.id, comment.id).then(result => {
      if (result.success) return;
      setHidden(current => current.filter(id => !branch.includes(id)));
      Alert.alert(t('common.error'), result.error || t('comments.deleteFailed'));
    });
  }, [comments, conversation, t]);

  const open = useCallback((comment: ConversationComment) => {
    const mine = comment.userId === viewerId;
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: t('common.cancel'), style: 'cancel' },
    ];
    if (!mine) {
      options.push({
        text: t('report.targetComment'),
        onPress: () => setReportTarget({ targetId: comment.id, reportedUserId: comment.userId }),
      });
    }
    if (mine || ownsConversation) {
      options.push({
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => Alert.alert(t('conversations.deleteCommentTitle'), t('conversations.deleteCommentConfirm'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: () => remove(comment) },
        ]),
      });
    }
    if (options.length === 1) return;
    Alert.alert(t('conversations.commentOptionsTitle'), undefined, options);
  }, [ownsConversation, remove, t, viewerId]);

  return {
    comments: visible,
    reportTarget,
    open,
    closeReport: useCallback(() => setReportTarget(null), []),
  };
}

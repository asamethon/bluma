import { canDeleteBoardPost } from '@/features/conversation/utils/boardPost';
import { conversationActions } from '@/store/conversationStore';
import { useAppSelector } from '@/store/hooks';
import type { Conversation } from '@/types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type ReportTarget = { targetId: string; reportedUserId: string };

/**
 * Pano gönderisinin üç nokta menüsü. Silme yazana VE pano sahibine açıktır
 * (kurallarla aynı koşul); şikâyet yalnızca BAŞKASININ gönderisinde görünür.
 * Yetki yoksa menü hiç açılmaz.
 */
export function useConversationMenu() {
  const { t } = useTranslation();
  const viewerId = useAppSelector(state => state.auth.user?.id);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const open = useCallback((conversation: Conversation) => {
    const mine = conversation.authorId === viewerId;
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: t('common.cancel'), style: 'cancel' },
    ];
    if (!mine) {
      options.push({
        text: t('report.targetConversation'),
        onPress: () => setReportTarget({ targetId: conversation.id, reportedUserId: conversation.authorId }),
      });
    }
    if (canDeleteBoardPost(conversation, viewerId)) {
      options.push({
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => Alert.alert(
          t('profileScreen.deleteConversationTitle'),
          t(mine ? 'profileScreen.deleteConversationConfirm' : 'profileScreen.deleteBoardPostConfirm'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () => void conversationActions.deleteConversation(conversation.id),
            },
          ],
        ),
      });
    }
    if (options.length === 1) return;
    Alert.alert(t('profileScreen.conversationOptionsTitle'), undefined, options);
  }, [t, viewerId]);

  return {
    reportTarget,
    open,
    closeReport: useCallback(() => setReportTarget(null), []),
  };
}

import i18n from '@/i18n';
import { shareStoryStyles as s } from '@/features/messaging/styles/shareStoryStyles';
import { Sheet, Text, useSheetAction } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useShareRecipients } from '@/features/messaging/hooks/useShareRecipients';
import { ShareRecipientRow } from './ShareRecipientRow';
import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { SharedStory, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ActivityIndicator, Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

/** Avatar (44) + satırın dikey iç boşluğu (2×10). Liste yüksekliği bundan hesaplanır. */
const ROW_HEIGHT = 64;
const MAX_LIST_HEIGHT = 320;

export function ShareStorySheet({
  visible,
  onClose,
  story,
  onShareLink,
}: {
  visible: boolean;
  onClose: () => void;
  story: SharedStory | null;
  onShareLink: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { recipients, loading } = useShareRecipients();
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});
  /**
   * Sistem paylaşım sayfası (UIActivityViewController), kapanmakta olan bir
   * modalın üstünden açılamaz — çağrı sessizce düşer. Aksiyon bu yüzden sheet
   * TAMAMEN kapandıktan sonra çalışır.
   */
  const after = useSheetAction(onClose);

  const sendToUser = useCallback(
    (user: User) => {
      if (!currentUserId || !story || sentTo[user.id]) return;
      setSentTo((prev) => ({ ...prev, [user.id]: true }));
      messagingActions.sendStory(currentUserId, user.id, story).catch((error: Error) => {
        setSentTo((prev) => ({ ...prev, [user.id]: false }));
        // Sessiz yutma yok: doğrulama gibi anlaşılır bir sebep varsa söylensin.
        if (error?.message) Alert.alert(i18n.t('common.error'), error.message);
      });
    },
    [currentUserId, story, sentTo]
  );

  return (
    <Sheet visible={visible} onClose={onClose} onClosed={after.run} contentStyle={s.body}>
      <Text variant="subheading" style={{ textAlign: 'center', marginBottom: 14 }}>{t('messages.share')}</Text>

      <Pressable
        onPress={() => after.schedule(onShareLink)}
        style={[s.linkRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
      >
        <View style={[s.linkIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="share-social" size={20} color={colors.primary} />
        </View>
        <Text variant="body" style={{ flex: 1, fontWeight: '600' }}>{t('messages.shareLink')}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </Pressable>

      <Text variant="caption" tone="textLight" style={{ fontWeight: '700', marginTop: 18, marginBottom: 4 }}>
        {t('messages.sendViaMessage')}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 28 }} />
      ) : recipients.length === 0 ? (
        <Text variant="body" tone="textLight" style={{ textAlign: 'center', paddingVertical: 24, fontStyle: 'italic' }}>
          {t('messages.noFollowingYet')}
        </Text>
      ) : (
        // FlashList kendi yüksekliğini ölçmez; sarmalayıcıya KESİN bir
        // yükseklik verilmezse sıfır yükseklikle çizilir ve liste hiç
        // görünmez. Satır sayısından hesaplanır, tavanla sınırlanır.
        <View style={{ height: Math.min(recipients.length * ROW_HEIGHT, MAX_LIST_HEIGHT) }}>
          <FlashList
            data={recipients}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
        <ShareRecipientRow user={item} sent={!!sentTo[item.id]} onSend={sendToUser} />
      )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </Sheet>
  );
}

import { Avatar, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { shareStoryStyles as styles } from '@/features/messaging/styles/shareStoryStyles';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = { user: User; sent: boolean; onSend: (user: User) => void };

/** Paylaşım sayfasındaki tek alıcı satırı ve gönder/gönderildi rozeti. */
export const ShareRecipientRow = memo(function ShareRecipientRow({ user, sent, onSend }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable onPress={() => onSend(user)} disabled={sent} style={styles.recipientRow}>
      <Avatar uri={user.profileImage} name={user.displayName} size={44} />
      <View style={styles.recipientBody}>
        <Text variant="body" numberOfLines={1} style={styles.recipientName}>
          {user.displayName || t('common.user')}
        </Text>
        {user.username ? (
          <Text variant="caption" tone="textLight" numberOfLines={1}>@{user.username}</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.sendBadge,
          { backgroundColor: sent ? colors.surfaceVariant : colors.primary },
        ]}
      >
        <Ionicons
          name={sent ? 'checkmark' : 'paper-plane'}
          size={14}
          color={sent ? colors.textLight : colors.onPrimary}
        />
        <Text
          variant="caption"
          color={sent ? colors.textLight : colors.onPrimary}
          style={styles.sendLabel}
        >
          {sent ? t('messages.sent') : t('messages.send')}
        </Text>
      </View>
    </Pressable>
  );
});

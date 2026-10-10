import { Avatar, CountBadge, Divider, Text } from '@/components/ui';
import { Fonts, Motion, Spacing, useTheme } from '@/constants/theme';
import { formatThreadTime } from '@/features/messaging/utils/time';
import { useThreadPreview } from '@/features/messaging/hooks/useThreadPreview';
import { MessageThread } from '@/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

/**
 * Sohbet satırı. Kart değil: hairline ayraçla dizilen editoryal liste öğesi.
 * Okunmamışlık kutu/renk yerine tipografik ağırlıkla belli edilir.
 */
function ThreadRowBase({
  thread,
  currentUserId,
  onPress,
  onLongPress,
}: {
  thread: MessageThread;
  currentUserId?: string;
  onPress: (otherUserId: string) => void;
  onLongPress?: (thread: MessageThread) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const other = thread.otherUser;
  const otherId = thread.participants.find((p) => p !== currentUserId);
  const unread = thread.unread > 0;
  const preview = useThreadPreview(thread, currentUserId);
  const fromMe = preview?.senderId === currentUserId;

  return (
    <View>
      <Pressable
        onPress={() => otherId && onPress(otherId)}
        onLongPress={onLongPress ? () => onLongPress(thread) : undefined}
        delayLongPress={350}
        style={({ pressed }) => [styles.row, { opacity: pressed ? Motion.pressOpacity : 1 }]}
        android_ripple={{ color: colors.surfaceVariant }}
      >
        <Avatar uri={other?.profileImage} name={other?.displayName} size={48} />

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={[styles.name, unread && { fontFamily: Fonts.sansBold }]}
            >
              {other?.displayName || t('common.user')}
            </Text>
            <Text variant="caption" color={unread ? colors.primary : colors.textLight}>
              {formatThreadTime(preview?.createdAt)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              variant="caption"
              numberOfLines={1}
              color={unread ? colors.text : colors.textLight}
              style={styles.preview}
            >
              {fromMe ? t('messages.youPrefix') : ''}
              {preview?.text || t('messages.startConversation')}
            </Text>
            {unread && <CountBadge count={thread.unread} />}
          </View>
        </View>
      </Pressable>
      <Divider inset={48 + Spacing.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  body: { flex: 1, minWidth: 0, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name: { flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  preview: { flex: 1 },
});

export const ThreadRow = React.memo(ThreadRowBase);

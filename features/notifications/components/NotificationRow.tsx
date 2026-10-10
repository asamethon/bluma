import { Avatar, Divider, IconButton, Text } from '@/components/ui';
import { Motion, alpha, useTheme } from '@/constants/theme';
import { localizeNotification } from '@/features/notifications/utils/localizeNotification';
import type { Notification } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { notificationStyles as styles } from '../styles/notificationStyles';
import { notificationMeta, notificationTimeAgo } from '../utils/notificationPresentation';

type Props = {
  item: Notification;
  onPress: (item: Notification) => void;
  onDelete: (id: string) => void;
};

function NotificationRowComponent({ item, onPress, onDelete }: Props) {
  const { colors } = useTheme();
  const meta = notificationMeta(item.type);
  const copy = localizeNotification(item);
  const unread = !item.isRead;

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          unread && { backgroundColor: alpha(colors.primary, 0.05) },
          { opacity: pressed ? Motion.pressOpacity : 1 },
        ]}
        onPress={() => onPress(item)}
      >
        {unread && <View style={[styles.unreadRule, { backgroundColor: colors.primary }]} />}

        <View style={styles.iconWrap}>
          {item.senderAvatar ? (
            <Avatar uri={item.senderAvatar} name={item.senderName} size={40} shape="rounded" />
          ) : (
            <View style={[styles.iconTile, { backgroundColor: alpha(meta.color, 0.14) }]}>
              <Ionicons name={meta.icon} size={19} color={meta.color} />
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: meta.color, borderColor: colors.background }]}>
            <Ionicons name={meta.icon} size={9} color="#fff" />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text variant="bodyStrong" numberOfLines={1}>{copy.title}</Text>
          <Text variant="caption" tone="textSecondary" numberOfLines={2}>{copy.message}</Text>
          <View style={styles.timeRow}>
            {unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            <Text variant="caption" tone="textLight">{notificationTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <IconButton
          icon="close"
          size={30}
          iconSize={15}
          color={colors.textLight}
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
        />
      </Pressable>
      <Divider inset={20} />
    </View>
  );
}

export const NotificationRow = memo(NotificationRowComponent);

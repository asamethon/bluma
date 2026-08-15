import { Avatar, Button, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PendingRequest } from '../hooks/useFollowRequests';

type Props = {
  request: PendingRequest;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onPress: (userId: string) => void;
};

export const FollowRequestRow = React.memo(function FollowRequestRow({
  request,
  onApprove,
  onReject,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const { user } = request;

  const approve = useCallback(() => onApprove(user.id), [onApprove, user.id]);
  const reject = useCallback(() => onReject(user.id), [onReject, user.id]);
  const open = useCallback(() => onPress(user.id), [onPress, user.id]);

  return (
    <View style={styles.row}>
      <Pressable style={styles.identity} onPress={open}>
        <Avatar uri={user.profileImage} name={user.displayName} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodyStrong" numberOfLines={1}>{user.displayName}</Text>
          <Text variant="caption" tone="textLight" numberOfLines={1}>
            @{user.username || 'user'}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Button label={t('followRequests.approve')} size="sm" onPress={approve} />
        <Button
          label={t('followRequests.reject')}
          size="sm"
          variant="secondary"
          onPress={reject}
        />
      </View>
    </View>
  );
}, (prev, next) => prev.request.user.id === next.request.user.id);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 12,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: 8 },
});

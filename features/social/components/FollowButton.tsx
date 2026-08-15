import { Text } from '@/components/ui';
import { Radius, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useFollow } from '../hooks/useFollow';

interface FollowButtonProps {
  userId: string | undefined;
  style?: StyleProp<ViewStyle>;
}

export function FollowButton({ userId, style }: FollowButtonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { requireAuth } = useGuestGate();
  const follow = useFollow(userId);

  if (!userId || follow.isSelf) return null;

  const handlePress = () => {
    if (!requireAuth('follow')) return;
    follow.toggle();
  };

  // Takip ediliyor ve "istek gönderildi" aynı sakin görünümü paylaşır.
  const muted = follow.isFollowing || follow.isRequested;
  const label = follow.isFollowing
    ? t('social.following')
    : follow.isRequested
      ? t('social.requested')
      : t('social.follow');

  return (
    <Pressable
      onPress={handlePress}
      disabled={follow.busy}
      hitSlop={6}
      style={[
        styles.pill,
        muted
          ? { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border }
          : { backgroundColor: colors.primary },
        style,
      ]}
    >
      {follow.busy ? (
        <ActivityIndicator size="small" color={muted ? colors.text : '#fff'} />
      ) : (
        <Text variant="label" color={muted ? colors.text : '#fff'}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
});

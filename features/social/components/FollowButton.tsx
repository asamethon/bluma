import { Text } from '@/components/ui';
import { Radius, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useFollow } from '../hooks/useFollow';

interface FollowButtonProps {
  userId: string | undefined;
  style?: StyleProp<ViewStyle>;
}

// Takip et/bırak pili — useFollow (optimistic) + misafir kapısını sarmalar.
// Kendi profilinde veya userId yoksa hiçbir şey render etmez.
export function FollowButton({ userId, style }: FollowButtonProps) {
  const { colors } = useTheme();
  const { requireAuth } = useGuestGate();
  const follow = useFollow(userId);

  if (!userId || follow.isSelf) return null;

  const handlePress = () => {
    if (!requireAuth('follow')) return;
    follow.toggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={follow.busy}
      hitSlop={6}
      style={[
        styles.pill,
        follow.isFollowing
          ? { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border }
          : { backgroundColor: colors.primary },
        style,
      ]}
    >
      {follow.busy ? (
        <ActivityIndicator size="small" color={follow.isFollowing ? colors.text : '#fff'} />
      ) : (
        <Text variant="label" color={follow.isFollowing ? colors.text : '#fff'}>
          {follow.isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
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

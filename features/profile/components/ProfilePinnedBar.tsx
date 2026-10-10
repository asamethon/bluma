import { Avatar, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { PINNED_ROW_HEIGHT } from '../profileLayout';

type Props = {
  topInset: number;
  name?: string;
  avatarUri?: string;
  /** Solda duran geri düğmesi gibi aksiyonlar (kendi profilimde yok). */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Sekme şeridi — akıştaki şeritle devir teslim yapan parça. */
  children: ReactNode;
};

/**
 * Künye kayıp gittiğinde tepeye yapışan kompakt başlık: kim olduğun,
 * bağlam düğmeleri ve sekmeler her zaman elin altında kalır.
 */
export function ProfilePinnedBar({ topInset, name, avatarUri, leading, trailing, children }: Props) {
  const { colors, borders } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(120)}
      style={[
        styles.root,
        {
          paddingTop: topInset,
          backgroundColor: colors.background,
          borderBottomWidth: borders.hair,
          borderBottomColor: colors.divider,
        },
      ]}
    >
      <View style={styles.row}>
        {leading}
        <Avatar uri={avatarUri} name={name} size={28} shape="rounded" />
        <Text variant="subheading" numberOfLines={1} style={styles.name}>{name}</Text>
        {trailing}
      </View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  row: {
    height: PINNED_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenX,
  },
  name: { flex: 1, minWidth: 0 },
});

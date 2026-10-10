import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

/**
 * Ağ durumu bildirimi. Editoryal dilde ekranı boydan boya kesen renkli şerit
 * yerine, üstte yüzen ölçülü bir kapsül.
 */
export default function OfflineIndicator({ showWhenOnline = false }: { showWhenOnline?: boolean }) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const net = useNetworkStatus();

  const [visible, setVisible] = useState(false);
  const wasOffline = useRef(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const clear = () => {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = null;
    };
    const show = () => {
      setVisible(true);
      progress.value = withTiming(1, { duration: 260 });
    };
    const hide = () => {
      progress.value = withTiming(0, { duration: 220 });
      hideTimer = setTimeout(() => setVisible(false), 240);
    };

    // Ağ durumu henüz çözülmediyse hiçbir şey gösterme: açılışta "çevrimdışı"
    // ve ardından "yeniden bağlandın" banner'ının çakmasının sebebi buydu.
    if (!net.isResolved) return clear;

    if (net.isOffline) {
      wasOffline.current = true;
      show();
    } else if (showWhenOnline && wasOffline.current) {
      wasOffline.current = false;
      show();
      hideTimer = setTimeout(hide, 2000);
    } else {
      hide();
    }
    return clear;
  }, [net.isOffline, net.isResolved, showWhenOnline, progress]);

  const anim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -16 }],
  }));

  if (!visible) return null;

  const offline = net.isOffline;
  const tint = offline ? colors.error : colors.success;

  return (
    <Animated.View style={[styles.wrap, { top: top + Spacing.sm }, anim]} pointerEvents="none">
      <View style={[styles.pill, shadows.md, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: tint }]} />
        <Ionicons name={offline ? 'cloud-offline-outline' : 'wifi'} size={15} color={tint} />
        <Text variant="label" color={colors.text} numberOfLines={1}>
          {offline ? t('offline.offlineBanner') : t('offline.reconnected')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

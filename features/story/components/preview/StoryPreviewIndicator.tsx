import { useTheme } from '@/constants/theme';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { createStoryPreviewStyles } from '../../styles/storyPreviewStyles';

type Styles = ReturnType<typeof createStoryPreviewStyles>;

const DOT = 4;
const ACTIVE = 18;

/**
 * Raftaki konum: nokta değil, ölçülü ilerleme şeridi. Genişlik ve renk
 * karuselin konumuna bağlıdır (`position` = kaçıncı kart, kesirli) — parmak
 * hareket ettikçe şerit büyür, adım adım sıçramaz.
 */
function PositionDot({ index, position, styles, idle, active }: {
  index: number;
  position: SharedValue<number>;
  styles: Styles;
  idle: string;
  active: string;
}) {
  const animation = useAnimatedStyle(() => {
    const progress = interpolate(position.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP);
    return {
      width: DOT + (ACTIVE - DOT) * progress,
      backgroundColor: interpolateColor(progress, [0, 1], [idle, active]),
    };
  });

  return <Animated.View style={[styles.dot, animation]} />;
}

export function StoryPreviewIndicator({ count, position, styles }: {
  count: number;
  position: SharedValue<number>;
  styles: Styles;
}) {
  const { colors } = useTheme();
  if (count < 2) return <View style={styles.indicator} />;

  return (
    <View style={styles.indicator} pointerEvents="none">
      {Array.from({ length: count }, (_, index) => (
        <PositionDot
          key={index}
          index={index}
          position={position}
          styles={styles}
          idle={colors.borderStrong}
          active={colors.primary}
        />
      ))}
    </View>
  );
}

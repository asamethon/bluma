import { StoryCover } from '@/components/ui/story-card/StoryCover';
import { Motion, Radius } from '@/constants/theme';
import type { Story } from '@/types';
import { useCallback, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { H_GAP, INDICATOR_BLOCK, createStoryPreviewStyles } from '../../styles/storyPreviewStyles';
import { StoryPreviewIndicator } from './StoryPreviewIndicator';

type Styles = ReturnType<typeof createStoryPreviewStyles>;

type Props = {
  stories: Story[];
  columnWidth: number;
  styles: Styles;
  onSelect: (index: number) => void;
  onOpen: () => void;
};

/** Komşu kapaklar küçülüp soluklaşır; odaktaki kapak tam ölçekte durur. */
function PreviewCover({ story, index, position, size, styles, onPress }: {
  story: Story;
  index: number;
  position: SharedValue<number>;
  size: { width: number; height: number };
  styles: Styles;
  onPress: (index: number) => void;
}) {
  const animation = useAnimatedStyle(() => ({
    opacity: interpolate(position.value, [index - 1, index, index + 1], [0.38, 1, 0.38], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(position.value, [index - 1, index, index + 1], [0.9, 1, 0.9], Extrapolation.CLAMP),
    }],
  }));

  return (
    <Animated.View style={[size, animation]}>
      <Pressable
        onPress={() => onPress(index)}
        accessibilityRole="button"
        accessibilityLabel={story.title}
        style={({ pressed }) => [styles.cardPress, { opacity: pressed ? Motion.pressOpacity : 1 }]}
      >
        <StoryCover story={story} radius={Radius.lg} style={styles.cover} />
      </Pressable>
    </Animated.View>
  );
}

export function StoryPreviewCarousel({ stories, columnWidth, styles, onSelect, onOpen }: Props) {
  // Kapak, kendisine kalan alandan ölçülür — sabit sayı tahmininden değil.
  const [stage, setStage] = useState(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const activeIndex = useSharedValue(0);

  const width = Math.min(Math.max(stage - INDICATOR_BLOCK, 0) * (2 / 3), columnWidth * 0.64);
  const size = { width, height: width * 1.5 };
  const interval = width + H_GAP;
  // Kapak ve konum şeridi TEK kaynaktan beslenir: kaçıncı karttayız (kesirli).
  const position = useDerivedValue(() => scrollX.value / interval);

  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
    const next = Math.max(0, Math.min(Math.round(event.contentOffset.x / interval), stories.length - 1));
    if (next !== activeIndex.value) {
      activeIndex.value = next;
      scheduleOnRN(onSelect, next);
    }
  });

  // Yandaki kapağa dokunmak onu ortalar, odaktakine dokunmak hikâyeyi açar.
  const onCardPress = useCallback((index: number) => {
    if (index === activeIndex.value) onOpen();
    else scrollRef.current?.scrollTo({ x: index * interval, animated: true });
  }, [activeIndex, interval, onOpen, scrollRef]);

  // Ölçü değişirse (döndürme) karusel sıfırdan kurulur; seçim de başa döner ki
  // ortadaki kapak ile künye birbirinden ayrı düşmesin.
  const onStageLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next === stage) return;
    if (stage > 0) {
      activeIndex.value = 0;
      scrollX.value = 0;
      onSelect(0);
    }
    setStage(next);
  }, [activeIndex, onSelect, scrollX, stage]);

  return (
    <View style={styles.stage} onLayout={onStageLayout}>
      {width > 0 && (
        <>
          <Animated.ScrollView
            // Ölçü kesinleştiğinde temiz bir 0 konumundan başla.
            key={`${stories[0]?.id}:${width}`}
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ height: size.height }}
            contentContainerStyle={[styles.carousel, { paddingHorizontal: (columnWidth - width) / 2 }]}
            snapToInterval={interval}
            decelerationRate="fast"
            snapToAlignment="start"
            scrollEventThrottle={16}
            onScroll={onScroll}
          >
            {stories.map((story, index) => (
              <PreviewCover
                key={story.id}
                story={story}
                index={index}
                position={position}
                size={size}
                styles={styles}
                onPress={onCardPress}
              />
            ))}
          </Animated.ScrollView>
          <StoryPreviewIndicator count={stories.length} position={position} styles={styles} />
        </>
      )}
    </View>
  );
}

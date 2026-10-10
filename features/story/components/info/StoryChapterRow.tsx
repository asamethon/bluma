import { Divider, Text } from '@/components/ui';
import { Motion, Spacing, useTheme } from '@/constants/theme';
import type { StoryInfoStyles } from '@/features/story/styles/storyInfoStyles';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

export type StoryChapterItem = { id: string; index: number; title: string };

type Props = { item: StoryChapterItem; styles: StoryInfoStyles; onPress: (index: number) => void };

/** Bölüm satırı: numaralı künye + başlık, altında hairline. */
export const StoryChapterRow = memo(function StoryChapterRow({ item, styles, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.chapterRow, { opacity: pressed ? Motion.pressOpacity : 1 }]}
        onPress={() => onPress(item.index)}
      >
        <View style={styles.chapterLeft}>
          <Text variant="labelSm" tone="textLight" style={styles.chapterIndex}>
            {String(item.index + 1).padStart(2, '0')}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>{item.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      </Pressable>
      <Divider inset={Spacing.screenX} />
    </View>
  );
});

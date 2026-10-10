import { IconButton } from '@/components/ui';
import { categoryColor, Spacing, useTheme } from '@/constants/theme';
import { storyInfoFormStyles as styles } from '@/features/story/styles/storyInfoFormStyles';
import type { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

type Props = { coverImage: string | null; category: StoryCategory; onPick: () => void };

/** Kapak önizlemesi ve kapak seçme düğmesi. */
export function StoryCoverPicker({ coverImage, category, onPick }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
      <View style={styles.coverWrap}>
        <View style={[styles.cover, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="book-outline" size={34} color={categoryColor(category)} />
          )}
        </View>
        <IconButton
          icon="camera-outline"
          variant="bloom"
          size={34}
          color="#fff"
          onPress={onPick}
          
          style={[styles.coverBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}
        />
      </View>
    </View>
  );
}

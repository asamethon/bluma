import { Text } from '@/components/ui';
import { Motion, Radius, Spacing, useTheme } from '@/constants/theme';
import { SharedStory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

/** Sohbette paylaşılan hikâye kartı — baloncuğun içinde ölçülü bir künye. */
function SharedStoryCardBase({
  story,
  mine,
  onPress,
}: {
  story: SharedStory;
  mine: boolean;
  onPress?: (storyId: string) => void;
}) {
  const { colors, borders } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onPress?.(story.id)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: mine ? 'transparent' : colors.border,
          borderWidth: mine ? 0 : borders.thin,
          opacity: pressed ? Motion.pressOpacity : 1,
        },
      ]}
    >
      {story.coverImage ? (
        <Image
          source={{ uri: story.coverImage }}
          style={[styles.cover, { backgroundColor: colors.surfaceVariant }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.cover, styles.coverFallback, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="book-outline" size={20} color={colors.primary} />
        </View>
      )}

      <View style={styles.body}>
        <Text variant="overline" color={colors.primary}>{t('common.story')}</Text>
        <Text variant="bodyStrong" numberOfLines={2}>{story.title}</Text>
        {!!story.authorName && (
          <Text variant="caption" tone="textLight" numberOfLines={1}>{story.authorName}</Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={17} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: 252,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  cover: { width: 46, height: 64, borderRadius: Radius.xs },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: 2 },
});

export const SharedStoryCard = React.memo(SharedStoryCardBase);

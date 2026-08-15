import { StoryCardSpine, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { Story } from '@/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

interface ProfileStoryShelfProps {
  title: string;
  count: number;
  stories: Story[];
  onStoryPress: (story: Story) => void;
}

export function ProfileStoryShelf({ title, count, stories, onStoryPress }: ProfileStoryShelfProps) {
  const { t } = useTranslation();
  if (stories.length === 0) return null;

  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.header}>
        <Text variant="heading" style={{ fontWeight: '700' }}>{title}</Text>
        <Text variant="caption" tone="textLight">{t('profile.bloomingStories', { count })}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelf}
      >
        {stories.slice(0, 6).map((story) => (
          <StoryCardSpine
            key={story.id}
            story={story}
            width={118}
            onPress={() => onStoryPress(story)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    marginBottom: 12,
  },
  shelf: {
    paddingHorizontal: Spacing.screenX,
    gap: Spacing.md,
    paddingBottom: 8,
  },
});

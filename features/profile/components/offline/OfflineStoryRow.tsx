import { IconButton } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { OfflineLibraryStyles } from '@/features/profile/styles/offlineLibraryStyles';
import { formatRelativeTime } from '@/features/story/utils/time';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatFileSize } from './fileSize';

export type OfflineStory = Story & { downloadedAt?: Date; size?: number };
type Props = { story: OfflineStory; styles: OfflineLibraryStyles; onOpen: (id: string) => void; onRemove: (id: string, title: string) => void };

export const OfflineStoryRow = memo(function OfflineStoryRow({ story, styles, onOpen, onRemove }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.storyCard} onPress={() => onOpen(story.id)}>
      {story.coverImage ? <Image source={{ uri: story.coverImage }} style={styles.coverImage} contentFit="cover" /> : null}
      <View style={styles.storyInfo}>
        <View style={styles.storyHeader}>
          <Text style={styles.storyTitle} numberOfLines={2}>{story.title}</Text>
          <IconButton
            icon="trash-outline"
            size={32}
            iconSize={18}
            color={colors.textSecondary}
            accessibilityLabel={t('common.delete')}
            onPress={() => onRemove(story.id, story.title)}
          />
        </View>
        <Text style={styles.authorName}>{story.author?.displayName || t('common.anonymous')}</Text>
        <View style={styles.storyMeta}>
          <View style={styles.metaItem}><Ionicons name="download-outline" size={12} color={colors.textSecondary} /><Text style={styles.metaText}>{story.downloadedAt ? formatRelativeTime(story.downloadedAt) : t('offlineLibrary.unknown')}</Text></View>
          <View style={styles.metaItem}><Ionicons name="document-outline" size={12} color={colors.textSecondary} /><Text style={styles.metaText}>{formatFileSize(story.size || 0)}</Text></View>
          <View style={styles.metaItem}><Ionicons name="time-outline" size={12} color={colors.textSecondary} /><Text style={styles.metaText}>{t('time.minutesShort', { count: story.readingTime || 5 })}</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

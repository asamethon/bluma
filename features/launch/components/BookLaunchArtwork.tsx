import { CategoryMeta, categoryColor } from '@/constants/theme';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { LaunchFormat } from '../types';
import { ARTWORK_BASE_WIDTH, createArtworkStyles } from './artworkStyles';

export function BookLaunchArtwork({
  story,
  format,
  onCoverReady,
}: { story: Story; format: LaunchFormat; onCoverReady?: () => void }) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const compact = format === 'post';
  const scale = width / ARTWORK_BASE_WIDTH;
  const styles = useMemo(() => createArtworkStyles(scale || 1, compact), [scale, compact]);
  const accent = categoryColor(story.category);
  const author = story.author?.displayName || `@${story.author?.username || t('common.authorUsername')}`;
  const genre = t(CategoryMeta[story.category]?.label || 'genres.other');

  return (
    <View
      style={styles.canvas}
      collapsable={false}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
    >
      {scale > 0 ? (
        <>
          <View style={[styles.orb, styles.orbTop, { backgroundColor: `${accent}45` }]} />
          <View style={[styles.orb, styles.orbBottom, { borderColor: `${accent}88` }]} />
          <View style={styles.brandRow}>
            <View style={styles.mark}>
              <Image
                source={require('../../../assets/images/icon.png')}
                style={[StyleSheet.absoluteFill, styles.markImage]}
                contentFit="cover"
              />
            </View>
            <Text style={styles.brand}>bluma</Text>
            <View style={styles.launchPill}>
              <Text style={styles.launchLabel}>{t('launch.newStory')}</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={[styles.coverDepth, { backgroundColor: accent }]} />
            <View style={styles.cover}>
              {story.coverImage ? (
                <Image
                  source={{ uri: story.coverImage }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  onLoad={() => onCoverReady?.()}
                  onError={() => onCoverReady?.()}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.coverFallback, { backgroundColor: accent }]}>
                  <Ionicons name="book-outline" size={Math.round(52 * scale)} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.coverShade} />
              <View style={styles.genreChip}><Text style={styles.genre}>{genre}</Text></View>
            </View>
          </View>

          <View style={styles.copy}>
            <Text style={[styles.eyebrow, { color: accent }]}>{t('launch.nowOnBluma')}</Text>
            <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
            <Text style={styles.author}>{t('launch.byAuthor', { author })}</Text>
            {!compact && story.description ? (
              <Text style={styles.description} numberOfLines={4}>{story.description}</Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{t('launch.readNow')}</Text>
              <Ionicons name="arrow-forward" size={Math.round(17 * scale)} color="#FFFFFF" />
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

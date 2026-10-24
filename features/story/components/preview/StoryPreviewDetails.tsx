import { Avatar, GenreTag, Text } from '@/components/ui';
import { Motion, useTheme } from '@/constants/theme';
import type { Story } from '@/types';
import { formatCount } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { createStoryPreviewStyles } from '../../styles/storyPreviewStyles';

type Props = {
  story: Story;
  styles: ReturnType<typeof createStoryPreviewStyles>;
  onAuthorPress: () => void;
};

/**
 * Kitap künyesi: tür, başlık, yazar ve tek satırlık ölçüler. Sayılar kutuya
 * ya da ayraç arasına alınmaz — orta noktayla ayrılan tipografik bir satırdır.
 *
 * Blok sabit yüksekliktedir (bkz. stiller): iki satırlık başlık ve üç satırlık
 * açıklama her hikâyede yer kaplar, böylece kapak kaydırılırken künye ve alt
 * aksiyon yerinden oynamaz. Açıklamanın tamamı hikâye sayfasındadır.
 */
export function StoryPreviewDetails({ story, styles, onAuthorPress }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const author = story.author;
  const meta = [
    t('studio.chapterCount', { count: story.chaptersCount || 1 }),
    t('story.readingMinutesShort', { count: story.readingTime || 5 }),
    story.viewsCount ? t('storyScreen.viewsCount', { value: formatCount(story.viewsCount) }) : null,
    story.likesCount ? t('storyScreen.likesCount', { value: formatCount(story.likesCount) }) : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.body}>
      <View style={styles.titleBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <GenreTag category={story.category ?? 'other'} />
          {story.targetAudience === 'adult' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${colors.error}1A` }}>
              <Ionicons name="warning" size={11} color={colors.error} />
              <Text variant="labelSm" color={colors.error}>18+</Text>
            </View>
          )}
        </View>
        <Text variant="title" numberOfLines={2}>{story.title || t('common.story')}</Text>
      </View>

      <Pressable
        onPress={onAuthorPress}
        disabled={!story.authorId}
        style={({ pressed }) => [styles.byline, { opacity: pressed ? Motion.pressOpacity : 1 }]}
      >
        <Avatar uri={author?.profileImage} name={author?.displayName} size={24} />
        <Text variant="label" tone="primary" numberOfLines={1}>
          {author?.username ? `@${author.username}` : author?.displayName || t('common.anonymous')}
        </Text>
      </Pressable>

      <Text variant="caption" tone="textLight">{meta}</Text>

      {!!story.description && (
        <Text variant="bodyLg" tone="textSecondary" numberOfLines={3} style={styles.desc}>
          {story.description}
        </Text>
      )}
    </View>
  );
}

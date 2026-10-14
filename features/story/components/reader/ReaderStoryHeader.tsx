import { Avatar, Button, GenreTag, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { useFollow } from '@/features/social/hooks/useFollow';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

type Props = { story: Story; colors: ReaderColors };

/**
 * Hikâyenin künye sayfası — kitabın iç kapağı gibi yalnızca BAŞTA durur.
 * Sonraki bölümlerde tekrar edilmez; kimlik üst çubukta taşınır.
 */
export function ReaderStoryHeader({ story, colors: reading }: Props) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { requireAuth } = useGuestGate();
  const follow = useFollow(story.authorId, undefined, { source: 'reader' });
  const toggleFollow = () => {
    if (requireAuth('follow')) follow.toggle();
  };

  return (
    <View>
      <View style={styles.tagRow}>
        <GenreTag category={story.category} />
        {story.targetAudience === 'adult' && (
          <View style={[styles.adultTag, { backgroundColor: `${colors.error}1A` }]}>
            <Ionicons name="warning" size={11} color={colors.error} />
            <Text style={[styles.adultText, { color: colors.error }]}>18+</Text>
          </View>
        )}
      </View>
      <Text style={[styles.storyTitle, { color: reading.text, fontFamily: fonts.serif }]}>
        {story.title}
      </Text>
      <View style={styles.authorRow}>
        <Pressable
          style={styles.authorPress}
          accessibilityRole="button"
          onPress={() => router.push(`/user/${story.authorId}` as never)}
        >
          <Avatar
            uri={story.author?.profileImage}
            name={story.author?.displayName}
            size={40}
          />
          <View style={styles.authorIdentity}>
            <Text variant="subheading" style={[styles.authorName, { color: reading.text }]} numberOfLines={1}>
              {story.author?.displayName || t('common.author')}
            </Text>
            <Text variant="caption" color={reading.textSecondary} numberOfLines={1}>
              @{story.author?.username || t('common.authorUsername')}
            </Text>
          </View>
        </Pressable>
        {!follow.isSelf && (
          <Button
            label={follow.isFollowing ? t('social.following') : t('social.follow')}
            variant={follow.isFollowing ? 'ghost' : 'outline'}
            size="sm"
            palette={{
              fg: follow.isFollowing ? reading.textSecondary : reading.text,
              border: follow.isFollowing ? undefined : reading.border,
            }}
            onPress={toggleFollow}
          />
        )}
      </View>
      <View style={[styles.mastheadRule, { backgroundColor: reading.border }]} />
    </View>
  );
}

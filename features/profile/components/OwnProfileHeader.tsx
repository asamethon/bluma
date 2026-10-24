import { Button, IconButton } from '@/components/ui';
import { RANKS, getRankIndex } from '@/features/challenges/definitions';
import { useAppSelector } from '@/store/hooks';
import type { Ionicons } from '@expo/vector-icons';
import type { Story, User } from '@/types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileHero } from './ProfileHero';
import { ProfileIdentity, profileHandle } from './ProfileIdentity';
import { ProfileProgressStrip } from './ProfileProgressStrip';
import { ProfileStatsBar } from './ProfileStatsBar';

type Props = {
  user: User;
  stories: Story[];
  topInset: number;
  onShare: () => void;
};

/**
 * Kendi profilimin künyesi. Sekmeler ve içerik listeye taşındı; burada yalnızca
 * kimlik, aksiyonlar ve ilerleme durur — böylece içerik bir ekran aşağı inmez.
 */
export function OwnProfileHeader({ user, stories, topInset, onShare }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const xp = useAppSelector(state => state.challenge.xp);
  const rank = RANKS[getRankIndex(xp)];
  const onCover = !!user.coverImage;
  const likes = stories.reduce((sum, story) => sum + (story.likesCount || 0), 0);

  return (
    <>
      <ProfileHero
        avatarUri={user.profileImage}
        coverUri={user.coverImage}
        avatarName={user.displayName}
        topInset={topInset}
        aside={
          <View style={styles.aside}>
            <Button
              label={t('common.edit')}
              variant="outline"
              size="sm"
              icon="create-outline"
              onPress={() => router.push('/profile/edit')}
            />
            <IconButton
              icon="share-social-outline"
              variant="outline"
              size={36}
              accessibilityLabel={t('messages.share')}
              onPress={onShare}
            />
          </View>
        }
        actions={
          <View style={[styles.heroActions, styles.heroActionsEnd]}>
            <IconButton
              icon="settings-outline"
              variant="sunk"
              color={onCover ? '#FFFFFF' : undefined}
              glassColorScheme={onCover ? 'dark' : undefined}
              style={onCover ? styles.coverAction : undefined}
              accessibilityLabel={t('settings.title')}
              onPress={() => router.push('/profile/settings')}
              size={40}
            />
          </View>
        }
      />

      <ProfileIdentity
        name={user.displayName}
        handle={profileHandle(user.username)}
        badge={{
          label: t(rank.name),
          icon: rank.icon as keyof typeof Ionicons.glyphMap,
        }}
        bio={user.bio}
      />

      <ProfileStatsBar
        stats={[
          { key: 'stories', value: stories.length, label: t('common.story') },
          {
            key: 'followers',
            value: user.followersCount || 0,
            label: t('profileScreen.followers'),
            onPress: () => router.push(`/profile/followers/${user.id}` as never),
          },
          {
            key: 'following',
            value: user.followingCount || 0,
            label: t('profileScreen.followingShort'),
            onPress: () => router.push(`/profile/following/${user.id}` as never),
          },
          { key: 'likes', value: likes, label: t('profileScreen.likes') },
        ]}
      >
        <ProfileProgressStrip onPress={() => router.push('/profile/challenges')} />
      </ProfileStatsBar>
    </>
  );
}

import { Button, IconButton } from '@/components/ui';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import type { User } from '@/types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileHero } from './ProfileHero';
import { ProfileIdentity, profileHandle } from './ProfileIdentity';
import { ProfileStatsBar } from './ProfileStatsBar';

type Props = {
  user: User;
  storyCount: number;
  topInset: number;
  ownProfile: boolean;
  guest: boolean;
  following: boolean;
  requested: boolean;
  accessLocked: boolean;
  messageAllowed: boolean;
  messageChecking: boolean;
  onBack: () => void;
  onMenu: () => void;
  onFollow: () => void;
  onMessage: () => void;
  onFollowers: () => void;
  onFollowing: () => void;
};

/**
 * Başkasının profilinin künyesi. Kendi profilimle aynı ritmi kullanır: kapak,
 * kimlik, aksiyonlar, istatistik şeridi. İçerik ve sekmeler listeye aittir.
 */
export function UserProfileHeader(props: Props) {
  const { t } = useTranslation();
  const { user } = props;
  const firstName = user.displayName?.split(' ')[0] || user.displayName || '';
  const onCover = !!user.coverImage;
  const coverProps = {
    color: onCover ? '#FFFFFF' : undefined,
    glassColorScheme: onCover ? ('dark' as const) : undefined,
    style: onCover ? styles.coverAction : undefined,
  };

  return (
    <>
      <ProfileHero
        avatarUri={user.profileImage}
        coverUri={user.coverImage}
        avatarName={user.displayName}
        topInset={props.topInset}
        aside={props.ownProfile ? undefined : (
          <View style={styles.aside}>
            <Button
              label={props.following
                ? t('social.following')
                : props.requested ? t('social.requested') : t('social.follow')}
              variant={props.following || props.requested ? 'outline' : 'primary'}
              icon={props.following ? 'checkmark' : props.requested ? 'time-outline' : 'add'}
              size="sm"
              onPress={props.onFollow}
            />
            {(props.guest || (!props.messageChecking && props.messageAllowed)) && (
              <IconButton
                icon="mail-outline"
                variant="outline"
                size={36}
                  accessibilityLabel={t('messages.chat')}
                onPress={props.onMessage}
              />
            )}
          </View>
        )}
        actions={
          <View style={styles.heroActions}>
            <IconButton
              icon="arrow-back"
              variant="sunk"
              size={40}
              accessibilityLabel={t('userProfile.goBack')}
              onPress={props.onBack}
              {...coverProps}
            />
            <View style={{ flex: 1 }} />
            {!props.ownProfile && (
              <IconButton
                icon="ellipsis-horizontal"
                variant="sunk"
                size={40}
                accessibilityLabel={t('common.more')}
                onPress={props.onMenu}
                {...coverProps}
              />
            )}
          </View>
        }
      />

      <ProfileIdentity
        name={user.displayName}
        handle={profileHandle(user.username, user.email)}
        bio={user.bio}
      />

      <ProfileStatsBar
        stats={[
          { key: 'stories', value: props.storyCount, label: t('common.story') },
          {
            key: 'followers',
            value: user.followersCount || 0,
            label: t('profileScreen.followers'),
            onPress: props.onFollowers,
          },
          {
            key: 'following',
            value: user.followingCount || 0,
            label: t('profileScreen.followingShort'),
            onPress: props.onFollowing,
          },
        ]}
      />

      {props.accessLocked && (
        <View style={styles.privateNotice}>
          <PrivateProfileNotice name={firstName} pending={props.requested} />
        </View>
      )}
    </>
  );
}

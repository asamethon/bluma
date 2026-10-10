import { Avatar, Button, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { User } from '@/types';
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { connectionsStyles as styles } from '../styles/connectionsStyles';

type Props = {
  user: User;
  following: boolean;
  isCurrentUser: boolean;
  showDivider: boolean;
  onOpen: (userId: string) => void;
  onToggleFollow: (user: User) => void;
};

function compactNumber(value?: number) {
  const count = value ?? 0;
  return count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}B` : `${count}`;
}

function ConnectionRowView({
  user,
  following,
  isCurrentUser,
  showDivider,
  onOpen,
  onToggleFollow,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const open = useCallback(() => onOpen(user.id), [onOpen, user.id]);
  const toggle = useCallback(() => onToggleFollow(user), [onToggleFollow, user]);

  return (
    <View>
      <Pressable style={styles.userRow} onPress={open}>
        <Avatar uri={user.profileImage} name={user.displayName} size={50} />
        <View style={styles.userIdentity}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text variant="caption" tone="textLight">
            @{user.username || 'user'} · {t('social.followerCount', {
              count: user.followersCount || 0,
              formatted: compactNumber(user.followersCount),
            })}
          </Text>
        </View>
        {!isCurrentUser && (
          <Button
            label={following ? t('social.followingShortBtn') : t('social.follow')}
            variant={following ? 'outline' : 'primary'}
            size="sm"
            onPress={toggle}
          />
        )}
      </Pressable>
      {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </View>
  );
}

export const ConnectionRow = memo(ConnectionRowView);

import { useGuestGate } from '@/contexts/GuestContext';
import { useCanMessage } from '@/features/privacy/hooks/useCanMessage';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { useFollow } from '@/features/social/hooks/useFollow';
import { useAppSelector } from '@/store/hooks';
import { moderationActions } from '@/store/moderationStore';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ProfileTab } from '../profileRows';
import { useProfileContent } from './useProfileContent';
import { useProfileUser } from './useProfileUser';

export function useUserProfileModel(profileId: string) {
  const { t } = useTranslation();
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const guest = useAppSelector(state => state.auth.isGuest);
  const blockedIds = useAppSelector(state => state.moderation.blockedUserIds);
  const { startAuth } = useGuestGate();
  const { user, isLoading } = useProfileUser(profileId);
  const content = useProfileContent(user);
  const access = useProfileAccess(user);
  const message = useCanMessage(user?.id);
  const follow = useFollow(user?.id, undefined, { live: true, source: 'profile' });
  const { isFollowing, toggle: toggleFollowState } = follow;
  const [tab, setTab] = useState<ProfileTab>('stories');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const blocked = !!user && blockedIds.includes(user.id);

  useEffect(() => {
    if (currentUserId) void moderationActions.loadBlockedUsers();
  }, [currentUserId]);

  const toggleFollow = useCallback(() => {
    if (!user || !currentUserId) return;
    if (!isFollowing) {
      toggleFollowState();
      return;
    }
    Alert.alert(
      t('social.unfollowTitle'),
      t('social.unfollowConfirm', { name: user.displayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('social.unfollowTitle'), style: 'destructive', onPress: toggleFollowState },
      ],
    );
  }, [currentUserId, isFollowing, t, toggleFollowState, user]);

  const report = useCallback(() => {
    setMenuVisible(false);
    setReportVisible(true);
  }, []);

  const toggleBlock = useCallback(() => {
    setMenuVisible(false);
    if (!user) return;
    if (blocked) {
      void moderationActions.unblockUser(user.id).then(result => {
        Alert.alert(
          result.success ? t('userProfile.unblockedTitle') : t('common.error'),
          result.success
            ? t('userProfile.unblockedMessage', { name: user.displayName })
            : result.error || t('moderation.unblockFailed'),
        );
      });
      return;
    }
    Alert.alert(t('userProfile.blockTitle'), t('userProfile.blockConfirm', { name: user.displayName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('userProfile.block'),
        style: 'destructive',
        onPress: () => {
          void moderationActions.blockUser(user.id).then(result => {
            if (result.success) {
              if (isFollowing) toggleFollowState();
              Alert.alert(t('userProfile.blockedTitle'), t('userProfile.blockedMessage'));
            } else Alert.alert(t('common.error'), result.error || t('moderation.blockFailed'));
          });
        },
      },
    ]);
  }, [blocked, isFollowing, t, toggleFollowState, user]);

  return {
    access,
    blocked,
    content,
    currentUserId,
    follow,
    guest,
    imageUri,
    isLoading,
    menuVisible,
    message,
    reportVisible,
    startAuth,
    tab,
    user,
    setImageUri,
    setMenuVisible,
    setReportVisible,
    setTab,
    report,
    toggleBlock,
    toggleFollow,
  };
}

import { useGuestGate } from '@/contexts/GuestContext';
import { useCanMessage } from '@/features/privacy/hooks/useCanMessage';
import { useCanPostToBoard } from '@/features/privacy/hooks/useCanPostToBoard';
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
  // `currentUserId` effect bağımlılığı olduğu için ayrı seçilir (obje değil);
  // `currentUser` yalnızca pano yazıcısına künye vermek için okunur.
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const currentUser = useAppSelector(state => state.auth.user);
  const guest = useAppSelector(state => state.auth.isGuest);
  const blockedIds = useAppSelector(state => state.moderation.blockedUserIds);
  const { startAuth } = useGuestGate();
  const { user, isLoading } = useProfileUser(profileId);
  const content = useProfileContent(user);
  const access = useProfileAccess(user);
  const message = useCanMessage(user?.id);
  const board = useCanPostToBoard(user?.id);
  const follow = useFollow(user?.id, undefined, { live: true, source: 'profile' });
  const { isFollowing, toggle: toggleFollowState } = follow;
  const [tab, setTab] = useState<ProfileTab>('stories');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
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

  // Pano yazma satırı: izin yoksa HİÇ gösterilmez; izin kontrolü sürerken de
  // basılmaz (bir kare görünüp kaybolmasın). Misafirde satır durur, dokunuşta
  // GuestGate devralır.
  const canPostToBoard = !!user && !access.locked && (guest || board.allowed);

  return {
    access,
    blocked,
    board,
    canPostToBoard,
    composerVisible,
    content,
    currentUser,
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
    setComposerVisible,
    setImageUri,
    setMenuVisible,
    setReportVisible,
    setTab,
    report,
    toggleBlock,
    toggleFollow,
  };
}

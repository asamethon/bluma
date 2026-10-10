import type { FollowSource } from '@/features/discovery/constants';
import { trackFollow } from '@/features/discovery/services/feedEvents';
import { authActions } from '@/store/authStore';
import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { getUserById } from '@/features/auth/services/userCache';
import { isPrivateAccount } from '@/features/privacy/types';
import { followRequestActions } from '../services/followRequests';
import { useIsFollower } from './useIsFollower';

/**
 * Takip durumu: yok → (gizli hesapta) istek gönderildi → takip ediliyor.
 * Gizli hesapta takipçi sayacı iyimser artırılmaz; takip onaydan sonra başlar.
 *
 * `live`: profil gibi tek kişilik ekranlarda takipçi dokümanı canlı dinlenir
 * (istek onaylanınca ekran kendiliğinden açılır). Listelerde kapalıdır —
 * satır başına dinleyici açmamak için.
 *
 * `source`: başarılı takip, butonun bulunduğu yerle birlikte ölçülür
 * (yazar önerilerinin işe yarayıp yaramadığını görmek için).
 */
export function useFollow(
  targetUserId: string | undefined,
  onCountChange?: (delta: number) => void,
  options?: { live?: boolean; source?: FollowSource }
) {
  const live = !!options?.live;
  const source = options?.source;
  const currentUserId = useAppSelector(s => s.auth.user?.id);
  const isSelf = !!targetUserId && targetUserId === currentUserId;

  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);

  const liveFollower = useIsFollower(targetUserId, live);

  // Dinleyici geldiğinde gerçek kaynak odur; onay/takipten çıkma anında yansır.
  useEffect(() => {
    if (liveFollower === null) return;
    setIsFollowing(liveFollower);
    if (liveFollower) setIsRequested(false);
  }, [liveFollower]);

  useEffect(() => {
    if (!targetUserId || !currentUserId || isSelf) return;
    const lifecycle = { active: true };

    (async () => {
      // Canlı modda takip durumu dinleyiciden gelir, tekrar okunmaz.
      const following = live
        ? false
        : await authActions.isFollowingUser(targetUserId).catch(() => false);
      if (!lifecycle.active) return;
      if (!live) setIsFollowing(following);

      const target = await getUserById(targetUserId).catch(() => null);
      if (!lifecycle.active) return;
      const priv = isPrivateAccount(target);
      setIsPrivate(priv);

      if (!following && priv) {
        const pending = await followRequestActions.hasPendingRequest(targetUserId);
        if (lifecycle.active) setIsRequested(pending);
      }
    })();

    return () => {
      lifecycle.active = false;
    };
  }, [targetUserId, currentUserId, isSelf, live]);

  const toggle = useCallback(() => {
    if (!targetUserId || busy || isSelf) return;
    setBusy(true);

    const settle = (promise: Promise<any>, revert: () => void) => {
      promise
        .then(r => { if (!r?.success) revert(); })
        .catch(revert)
        .finally(() => setBusy(false));
    };

    if (isFollowing) {
      setIsFollowing(false);
      onCountChange?.(-1);
      settle(authActions.unfollowUser(targetUserId), () => {
        setIsFollowing(true);
        onCountChange?.(1);
      });
      return;
    }

    if (isRequested) {
      setIsRequested(false);
      settle(followRequestActions.cancelFollowRequest(targetUserId), () => setIsRequested(true));
      return;
    }

    if (isPrivate) {
      setIsRequested(true);
      settle(followRequestActions.sendFollowRequest(targetUserId), () => setIsRequested(false));
      return;
    }

    setIsFollowing(true);
    onCountChange?.(1);
    const undoOptimisticFollow = () => {
      setIsFollowing(false);
      onCountChange?.(-1);
    };
    authActions
      .followUser(targetUserId)
      .then(r => {
        if (!r?.success) {
          undoOptimisticFollow();
          return;
        }
        // Hesap bu arada gizliye dönmüşse servis takip yerine istek gönderir.
        if ((r as { pending?: boolean }).pending) {
          undoOptimisticFollow();
          setIsPrivate(true);
          setIsRequested(true);
          return;
        }
        if (source) trackFollow(source);
      })
      .catch(undoOptimisticFollow)
      .finally(() => setBusy(false));
  }, [targetUserId, busy, isSelf, isFollowing, isRequested, isPrivate, onCountChange, source]);

  return { isFollowing, isRequested, isPrivate, isSelf, busy, toggle };
}

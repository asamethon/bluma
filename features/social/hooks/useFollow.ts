import { authActions, authState$ } from '@/store/authStore';
import { useCallback, useEffect, useState } from 'react';

// Optimistic takip hook'u — mimarinin referans implementasyonu
// (bkz. docs/ARCHITECTURE.md). UI anında güncellenir, Firestore işi arka
// planda yürür, hatada geri alınır; `busy` yalnızca çift tıklamayı engeller
// (spinner göstermek için DEĞİL).
//
// `onCountChange`: ekran, takipçi sayacı gibi yerel state'ini optimistic
// güncellemek isterse delta (+1/-1) alır; geri almalarda ters delta gelir.
export function useFollow(
  targetUserId: string | undefined,
  onCountChange?: (delta: number) => void
) {
  const currentUserId = authState$.user.get()?.id;
  const isSelf = !!targetUserId && targetUserId === currentUserId;

  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Mevcut takip durumunu yükle (misafir/kendi profili için gereksiz)
  useEffect(() => {
    if (!targetUserId || !currentUserId || isSelf) return;
    authActions.isFollowingUser(targetUserId).then(setIsFollowing).catch(() => {});
  }, [targetUserId, currentUserId, isSelf]);

  const toggle = useCallback(() => {
    if (!targetUserId || busy || isSelf) return;
    const next = !isFollowing;

    // Optimistic: önce UI
    setIsFollowing(next);
    onCountChange?.(next ? 1 : -1);
    setBusy(true);

    const revert = () => {
      setIsFollowing(!next);
      onCountChange?.(next ? -1 : 1);
    };

    (next ? authActions.followUser(targetUserId) : authActions.unfollowUser(targetUserId))
      .then(r => { if (!r?.success) revert(); })
      .catch(revert)
      .finally(() => setBusy(false));
  }, [targetUserId, busy, isSelf, isFollowing, onCountChange]);

  return { isFollowing, isSelf, busy, toggle };
}

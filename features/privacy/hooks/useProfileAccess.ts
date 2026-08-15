import { useAppSelector } from '@/store/hooks';
import { useIsFollower } from '@/features/social/hooks/useIsFollower';
import { isPrivateAccount } from '../types';

type Subject = { id?: string; privacy?: any } | null | undefined;

/**
 * Gizli hesabın içeriği yalnızca takipçilerine açılır. Takipçi durumu canlı
 * dinlenir: takipten çıkınca ekran anında kilitlenir, istek onaylanınca
 * anında açılır. `checking` true iken karar kesinleşmemiştir (yanıp sönmemesi
 * için içerik gösterilmez).
 */
export function useProfileAccess(target: Subject) {
  const myId = useAppSelector(s => s.auth.user?.id);
  const targetId = target?.id;
  const isPrivate = isPrivateAccount(target);
  const isSelf = !!targetId && targetId === myId;
  const needsCheck = !!targetId && isPrivate && !isSelf;

  const isFollower = useIsFollower(targetId, needsCheck);

  const checking = needsCheck && !!myId && isFollower === null;
  const locked = needsCheck && !checking && !isFollower;

  return { locked, checking, isPrivate, isSelf };
}

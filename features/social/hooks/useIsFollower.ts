import { useEffect, useState } from 'react';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useAppSelector } from '@/store/hooks';

/**
 * `users/{ownerId}/followers/{ben}` üzerinde CANLI takipçi durumu.
 * Takipten çıkma ve istek onayı ekran açıkken de anında yansısın diye
 * tek seferlik okuma yerine dinleyici kullanılır. `null` = henüz bilinmiyor.
 */
export function useIsFollower(ownerId?: string, enabled = true): boolean | null {
  const myId = useAppSelector(s => s.auth.user?.id);
  const [isFollower, setIsFollower] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled || !ownerId || !myId || ownerId === myId) {
      setIsFollower(null);
      return;
    }
    return onSnapshot(
      doc(getFirestore(), 'users', ownerId, 'followers', myId),
      snap => setIsFollower(!!(snap && snap.exists())),
      () => setIsFollower(false)
    );
  }, [ownerId, myId, enabled]);

  return isFollower;
}

import { useEffect, useState } from 'react';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { getUserById } from '@/features/auth/services/userCache';
import { User } from '@/store/slices/authSlice';

/**
 * Görüntülenen profilin CANLI kullanıcı dokümanı. Önbellekten hızlı ilk çizim,
 * ardından dinleyici: gizlilik değişimi, takipçi sayacı ve profil düzenlemeleri
 * ekran açıkken de anında yansır.
 */
export function useProfileUser(userId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    let alive = true;
    setIsLoading(true);
    setUser(null);

    getUserById(userId)
      .then(cached => {
        // Dinleyici henüz cevap vermediyse önbellekle boş ekranı doldur.
        if (!alive || !cached) return;
        setUser(prev => prev ?? cached);
        setIsLoading(false);
      })
      .catch(() => {});

    const unsub = onSnapshot(
      doc(getFirestore(), 'users', userId),
      snap => {
        if (!alive) return;
        setUser(snap && snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as User) : null);
        setIsLoading(false);
      },
      () => alive && setIsLoading(false)
    );

    return () => {
      alive = false;
      unsub();
    };
  }, [userId]);

  return { user, isLoading };
}

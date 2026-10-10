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
    const lifecycle = { active: true };
    setIsLoading(true);
    setUser(null);

    getUserById(userId)
      .then(cached => {
        // Dinleyici henüz cevap vermediyse önbellekle boş ekranı doldur.
        if (!lifecycle.active || !cached) return;
        setUser(prev => prev ?? cached);
        setIsLoading(false);
      })
      .catch(() => {});

    const unsub = onSnapshot(
      doc(getFirestore(), 'users', userId),
      snap => {
        if (!lifecycle.active) return;
        setUser(snap && snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as User) : null);
        setIsLoading(false);
      },
      () => lifecycle.active && setIsLoading(false)
    );

    return () => {
      lifecycle.active = false;
      unsub();
    };
  }, [userId]);

  return { user, isLoading };
}

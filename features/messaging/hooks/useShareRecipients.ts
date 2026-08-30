import { getUserById } from '@/features/story/services/userCache';
import { privacyActions } from '@/features/privacy/services/privacyService';
import { useAppSelector } from '@/store/hooks';
import { User } from '@/types';
import { collection, getDocs, getFirestore } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';

export function useShareRecipients() {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const threads = useAppSelector((s) => s.messaging.threads);
  const [recipients, setRecipients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Kullanıcı yoksa erken çıkılır ama yükleniyor bayrağı MUTLAKA düşer;
    // aksi halde sayfa sonsuza kadar spinner'da kalıyordu.
    if (!currentUserId) {
      setRecipients([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const followingSnap = await getDocs(collection(db, 'users', currentUserId, 'following'));
        const followingUsers = await Promise.all(followingSnap.docs.map((d) => getUserById(d.id)));

        const byId = new Map<string, User>();
        threads.forEach((t) => t.otherUser && byId.set(t.otherUser.id, t.otherUser));
        followingUsers.forEach((u) => u && !byId.has(u.id) && byId.set(u.id, u));
        byId.delete(currentUserId);

        // Mesajlara kapalı hesaplar listeden düşer (gönderim zaten reddedilirdi).
        const candidates = Array.from(byId.values());
        const allowed = await Promise.all(
          candidates.map(u => privacyActions.canSendMessageTo(u.id).catch(() => true))
        );
        const reachable = candidates.filter((_, i) => allowed[i]);

        if (alive) setRecipients(reachable);
      } catch {
        if (alive) setRecipients([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentUserId, threads]);

  return { recipients, loading };
}

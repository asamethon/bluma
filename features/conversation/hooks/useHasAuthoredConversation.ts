import { useAppSelector } from '@/store/hooks';
import { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore, limit, query, where } from '@react-native-firebase/firestore';

export function useHasAuthoredConversation(uid?: string) {
  const userConversations = useAppSelector(state => state.conversation.userConversations);
  const [hasAuthored, setHasAuthored] = useState<boolean>(() => {
    if (!uid) return false;
    return userConversations.some(conv => conv.authorId === uid);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setHasAuthored(false);
      return;
    }

    const fromStore = userConversations.some(conv => conv.authorId === uid);
    if (fromStore) {
      setHasAuthored(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const q = query(
          collection(getFirestore(), 'conversations'),
          where('authorId', '==', uid),
          limit(1),
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setHasAuthored(!snap.empty);
        }
      } catch {
        if (!cancelled) {
          setHasAuthored(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, userConversations]);

  return { hasAuthored, loading };
}

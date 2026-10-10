import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { getUserById } from '@/features/auth/services/userCache';
import { User } from '@/store/slices/authSlice';
import { followRequestActions } from '../services/followRequests';

export type PendingRequest = { user: User; createdAt?: any };

/** Bana gelen bekleyen takip istekleri (canlı). */
export function useFollowRequests() {
  const myId = useAppSelector(s => s.auth.user?.id);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const lifecycle = { active: true };
    setLoading(true);

    const unsub = followRequestActions.listenPendingRequests(myId, async docs => {
      const users = await Promise.all(docs.map(d => getUserById(d.id).catch(() => null)));
      if (!lifecycle.active) return;
      const resolved: PendingRequest[] = [];
      docs.forEach((d, i) => {
        const user = users[i];
        if (user) resolved.push({ user, createdAt: d.createdAt });
      });
      setRequests(resolved);
      setLoading(false);
    });

    return () => {
      lifecycle.active = false;
      unsub();
    };
  }, [myId]);

  const approve = async (userId: string) => {
    setRequests(prev => prev.filter(r => r.user.id !== userId));
    await followRequestActions.approveRequest(userId);
  };

  const reject = async (userId: string) => {
    setRequests(prev => prev.filter(r => r.user.id !== userId));
    await followRequestActions.rejectRequest(userId);
  };

  return { requests, loading, approve, reject };
}

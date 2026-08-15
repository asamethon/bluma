import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';

export type GateReason = 'follow' | 'like' | 'save' | 'comment' | 'write' | 'read' | 'default';

interface GuestContextValue {
  requireAuth: (reason: GateReason, onSuccess?: () => void) => boolean;
  startAuth: (view?: 'signup' | 'login') => void;
  closeGate: () => void;
  gate: { reason: GateReason } | null;
}

const GuestContext = createContext<GuestContextValue>({
  requireAuth: () => true,
  startAuth: () => {},
  closeGate: () => {},
  gate: null,
});

export const useGuestGate = () => useContext(GuestContext);

export const GATE_REASONS: Record<GateReason, { icon: string; title: string; sub: string }> = {
  follow:  { icon: 'person-add',          title: 'authGate.follow.title',  sub: 'authGate.follow.sub' },
  like:    { icon: 'heart',               title: 'authGate.like.title',    sub: 'authGate.like.sub' },
  save:    { icon: 'bookmark',            title: 'authGate.save.title',    sub: 'authGate.save.sub' },
  comment: { icon: 'chatbubble-ellipses', title: 'authGate.comment.title', sub: 'authGate.comment.sub' },
  write:   { icon: 'create',              title: 'authGate.write.title',   sub: 'authGate.write.sub' },
  read:    { icon: 'book',               title: 'authGate.read.title',    sub: 'authGate.read.sub' },
  default: { icon: 'leaf',               title: 'authGate.default.title', sub: 'authGate.default.sub' },
};

export const GuestProvider = function GuestProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isGuest } = useAppSelector(s => s.auth);
  const [gate, setGate] = useState<{ reason: GateReason } | null>(null);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      setGate(null);
      const fn = pending.current;
      pending.current = null;
      fn?.();
    }
  }, [isAuthenticated, isGuest]);

  const requireAuth = useCallback((reason: GateReason, onSuccess?: () => void): boolean => {
    if (!isGuest) return true;
    pending.current = onSuccess ?? null;
    setGate({ reason });
    return false;
  }, [isGuest]);

  const startAuth = useCallback((view: 'signup' | 'login' = 'signup') => {
    setGate(null);
    router.push(view === 'signup' ? '/(auth)/signup' : '/(auth)/signin');
  }, [router]);

  const closeGate = useCallback(() => {
    setGate(null);
    pending.current = null;
  }, []);

  return (
    <GuestContext.Provider value={{ requireAuth, startAuth, closeGate, gate }}>
      {children}
    </GuestContext.Provider>
  );
}

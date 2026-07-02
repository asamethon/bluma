import { authState$ } from '@/store/authStore';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
  follow:  { icon: 'person-add',          title: 'Yazarları takip et',  sub: 'Beğendiğin yazarları takip etmek ve yeni bölümlerinden haberdar olmak için ücretsiz bir hesap aç.' },
  like:    { icon: 'heart',               title: 'Beğenini kaydet',     sub: 'Beğendiğin hikâyeleri sakla; sana benzerlerini önerelim. Saniyeler sürer.' },
  save:    { icon: 'bookmark',            title: 'Kütüphanene ekle',    sub: 'Hikâyeleri kaydet, kaldığın yerden devam et. Hepsi tek bir rafta seni bekler.' },
  comment: { icon: 'chatbubble-ellipses', title: 'Sohbete katıl',       sub: 'Yazarlara yorum bırakmak ve okurlarla konuşmak için hesabını oluştur.' },
  write:   { icon: 'create',              title: 'İlk hikâyeni yaz',    sub: 'Kendi hikâyeni yazmaya başlamak için bir hesaba ihtiyacın var. Bahçen seni bekliyor.' },
  read:    { icon: 'book',               title: 'Okumaya devam et',    sub: 'Bu bölümün kalanını ve tüm hikâyeyi okumak için ücretsiz bir hesap aç.' },
  default: { icon: 'leaf',               title: "Bluma'ya katıl",      sub: 'Bunu yapmak için ücretsiz bir hesaba ihtiyacın var.' },
};

export const GuestProvider = observer(function GuestProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isGuest } = authState$.get();
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
});

import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { useAppSelector } from '@/store/hooks';
import { preferencesActions } from '@/store/preferencesStore';
import type { Story } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, type ReactElement } from 'react';
import { ReaderUnavailable } from './ReaderUnavailable';

type Blocked = { blocked: ReactElement; story?: undefined };
type Allowed = { blocked?: undefined; story: Story };

/**
 * Okuyucunun gösterilip gösterilemeyeceğine karar verir: yükleniyor, silinmiş,
 * gizlenmiş, yetişkin içerik ya da gizli hesap durumlarında yerine bir bilgi
 * ekranı döner.
 *
 * Yetişkin içerik kapısı son savunma hattıdır: akış ve arama zaten filtreler,
 * ama profil, bildirim, paylaşım bağlantısı ya da "sıradaki okumalar"dan da
 * okuyucuya gelinebilir.
 */
export function useReaderGuard(
  story: Story | null,
  isLoading: boolean,
  safeTop: number,
): Blocked | Allowed {
  const router = useRouter();
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const showMature = useAppSelector(state => state.preferences.showMatureContent);
  const preferencesLoaded = useAppSelector(state => state.preferences.loaded);
  const authorAccess = useProfileAccess(story?.author);
  // Bağlantıyla doğrudan okuyucuya gelinirse tercihler henüz yüklenmemiştir
  // (ana sayfa yüklüyordu): yetişkin içerik kararı ve okuma teması için gerekli.
  useEffect(() => {
    if (!preferencesLoaded) void preferencesActions.load();
  }, [preferencesLoaded]);

  const unavailable = (kind: Parameters<typeof ReaderUnavailable>[0]['kind'], authorName?: string) => ({
    blocked: (
      <ReaderUnavailable
        kind={kind}
        safeTop={safeTop}
        authorName={authorName}
        onBack={router.back}
        onOpenSettings={() => router.push('/profile/settings' as never)}
      />
    ),
  });

  if (isLoading) return unavailable('loading');
  if (!story) return unavailable('missing');
  if (story.isHidden && story.authorId !== currentUserId) return unavailable('hidden');
  if (story.targetAudience === 'adult' && story.authorId !== currentUserId) {
    if (isGuest) return unavailable('mature-guest');
    if (!preferencesLoaded) return unavailable('loading');
    if (!showMature) return unavailable('mature');
  }
  if (authorAccess.locked) return unavailable('private', story.author?.displayName);
  if (authorAccess.checking) return unavailable('private-check', story.author?.displayName);
  return { story };
}

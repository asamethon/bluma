import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { useAppSelector } from '@/store/hooks';
import type { Story } from '@/types';
import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { ReaderUnavailable } from './ReaderUnavailable';

type Blocked = { blocked: ReactElement; story?: undefined };
type Allowed = { blocked?: undefined; story: Story };

/**
 * Okuyucunun gösterilip gösterilemeyeceğine karar verir: yükleniyor, silinmiş,
 * gizlenmiş ya da gizli hesap durumlarında yerine bir bilgi ekranı döner.
 */
export function useReaderGuard(
  story: Story | null,
  isLoading: boolean,
  safeTop: number,
): Blocked | Allowed {
  const router = useRouter();
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const authorAccess = useProfileAccess(story?.author);

  const unavailable = (kind: Parameters<typeof ReaderUnavailable>[0]['kind'], authorName?: string) => ({
    blocked: (
      <ReaderUnavailable kind={kind} safeTop={safeTop} authorName={authorName} onBack={router.back} />
    ),
  });

  if (isLoading) return unavailable('loading');
  if (!story) return unavailable('missing');
  if (story.isHidden && story.authorId !== currentUserId) return unavailable('hidden');
  if (authorAccess.locked) return unavailable('private', story.author?.displayName);
  if (authorAccess.checking) return unavailable('private-check', story.author?.displayName);
  return { story };
}

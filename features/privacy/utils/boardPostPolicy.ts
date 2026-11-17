import type { BoardPostPolicy } from '@/types';

type Input = {
  /** Pano sahibinin ayarı; alan yoksa (eski hesap) 'everyone' sayılır. */
  policy?: BoardPostPolicy;
  ownerId?: string;
  viewerId?: string;
  /** Pano sahibi, yazmak isteyeni takip ediyor mu. */
  followedByOwner?: boolean;
};

/**
 * Yazar panosuna gönderi bırakma izni — `firestore.rules`
 * içindeki `acceptsBoardPostFrom` ile aynı karar. Kendi panosu her zaman açık;
 * misafir (viewerId yok) yazamaz.
 */
export function canPostToBoard({ policy, ownerId, viewerId, followedByOwner }: Input): boolean {
  if (!viewerId || !ownerId) return false;
  if (viewerId === ownerId) return true;
  if (policy === 'nobody') return false;
  if (policy === 'following') return !!followedByOwner;
  return true;
}

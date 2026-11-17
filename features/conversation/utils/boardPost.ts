import type { Conversation } from '@/types';

/** Panoya bakıldığında bir kaydın ait olup olmadığını belirleyen alanlar. */
type BoardRecord = { authorId?: string; boardOwnerId?: string };

/**
 * Panonun sahibi: alan yazılmışsa o, yoksa yazarın kendisi. Eski istemcinin
 * `boardOwnerId` olmadan açtığı konuşmalar yazarın panosunda sayılır.
 */
export const boardOwnerOf = (record: BoardRecord): string | undefined =>
  record.boardOwnerId || record.authorId;

/**
 * `profileId` panosunda görünmesi gereken kayıt mı? Profil sorgusu
 * `authorId == uid OR boardOwnerId == uid` olduğu için sonuç, kullanıcının
 * BAŞKALARININ panosuna bıraktığı gönderileri de taşır; onlar burada elenir.
 */
export const belongsOnBoard = (record: BoardRecord, profileId: string): boolean =>
  boardOwnerOf(record) === profileId;

/** Gönderi başka birinin panosunda mı duruyor (künyede hedef gösterilir). */
export const isBoardGuestPost = (record: BoardRecord): boolean =>
  !!record.boardOwnerId && !!record.authorId && record.boardOwnerId !== record.authorId;

/** Gönderiyi silebilen: yazan ya da pano sahibi (kurallarla aynı koşul). */
export const canDeleteBoardPost = (record: BoardRecord, viewerId?: string): boolean =>
  !!viewerId && (record.authorId === viewerId || record.boardOwnerId === viewerId);

/** "Işık ▸ Samet" künyesi; gönderi kendi panosundaysa yalnızca yazar adı. */
export function boardByline(conversation: Conversation, fallback: string): string {
  const author = conversation.author?.displayName || conversation.author?.username || fallback;
  if (!isBoardGuestPost(conversation)) return author;
  const owner = conversation.boardOwner?.displayName || conversation.boardOwner?.username;
  return owner ? `${author} ▸ ${owner}` : author;
}

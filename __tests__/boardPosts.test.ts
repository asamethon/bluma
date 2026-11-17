import {
  belongsOnBoard,
  boardByline,
  boardOwnerOf,
  canDeleteBoardPost,
  isBoardGuestPost,
} from '@/features/conversation/utils/boardPost';
import { canPostToBoard } from '@/features/privacy/utils/boardPostPolicy';
import type { Conversation } from '@/types';

describe('pano süzgeci', () => {
  it('alan yoksa gönderi yazarın kendi panosunda sayılır (eski istemci)', () => {
    expect(boardOwnerOf({ authorId: 'ayse' })).toBe('ayse');
    expect(belongsOnBoard({ authorId: 'ayse' }, 'ayse')).toBe(true);
    expect(belongsOnBoard({ authorId: 'ayse' }, 'samet')).toBe(false);
  });

  it('başkasının panosuna bırakılan gönderi yalnızca o panoda görünür', () => {
    const post = { authorId: 'ayse', boardOwnerId: 'samet' };
    expect(belongsOnBoard(post, 'samet')).toBe(true);
    expect(belongsOnBoard(post, 'ayse')).toBe(false);
  });

  it('kendi panosuna yazılan gönderi yazarın panosunda kalır', () => {
    const post = { authorId: 'ayse', boardOwnerId: 'ayse' };
    expect(belongsOnBoard(post, 'ayse')).toBe(true);
    expect(isBoardGuestPost(post)).toBe(false);
  });

  it('hedef künyesi yalnızca başka panodaki gönderide gösterilir', () => {
    expect(isBoardGuestPost({ authorId: 'ayse', boardOwnerId: 'samet' })).toBe(true);
    expect(isBoardGuestPost({ authorId: 'ayse' })).toBe(false);
  });
});

describe('pano gönderisi silme yetkisi', () => {
  const post = { authorId: 'ayse', boardOwnerId: 'samet' };
  it('yazan ve pano sahibi silebilir, üçüncü kişi silemez', () => {
    expect(canDeleteBoardPost(post, 'ayse')).toBe(true);
    expect(canDeleteBoardPost(post, 'samet')).toBe(true);
    expect(canDeleteBoardPost(post, 'isik')).toBe(false);
    expect(canDeleteBoardPost(post, undefined)).toBe(false);
  });
});

describe('pano künyesi', () => {
  const base = {
    author: { displayName: 'Işık' },
    boardOwner: { displayName: 'Samet' },
  } as unknown as Conversation;

  it('başka panodaki gönderide hedefi gösterir', () => {
    const post = { ...base, authorId: 'isik', boardOwnerId: 'samet' };
    expect(boardByline(post, 'Kullanıcı')).toBe('Işık ▸ Samet');
  });

  it('kendi panosundaki gönderide yalnızca yazarı gösterir', () => {
    const post = { ...base, authorId: 'isik', boardOwnerId: 'isik' };
    expect(boardByline(post, 'Kullanıcı')).toBe('Işık');
  });

  it('pano sahibinin künyesi henüz çözülmediyse yalnızca yazarı gösterir', () => {
    const post = { ...base, boardOwner: undefined, authorId: 'isik', boardOwnerId: 'samet' };
    expect(boardByline(post, 'Kullanıcı')).toBe('Işık');
  });
});

describe('panoya yazma izni', () => {
  const owner = 'samet';
  const viewer = 'ayse';

  it('ayar yoksa (eski hesap) herkes yazabilir', () => {
    expect(canPostToBoard({ ownerId: owner, viewerId: viewer })).toBe(true);
  });

  it("'everyone' herkese açıktır", () => {
    expect(canPostToBoard({ policy: 'everyone', ownerId: owner, viewerId: viewer })).toBe(true);
  });

  it("'nobody' kendisi dışında kimseye izin vermez", () => {
    expect(canPostToBoard({ policy: 'nobody', ownerId: owner, viewerId: viewer })).toBe(false);
    expect(canPostToBoard({ policy: 'nobody', ownerId: owner, viewerId: owner })).toBe(true);
  });

  it("'following' yalnızca pano sahibinin takip ettiklerine izin verir", () => {
    expect(canPostToBoard({ policy: 'following', ownerId: owner, viewerId: viewer, followedByOwner: true })).toBe(true);
    expect(canPostToBoard({ policy: 'following', ownerId: owner, viewerId: viewer, followedByOwner: false })).toBe(false);
    expect(canPostToBoard({ policy: 'following', ownerId: owner, viewerId: viewer })).toBe(false);
  });

  it('misafir yazamaz', () => {
    expect(canPostToBoard({ policy: 'everyone', ownerId: owner })).toBe(false);
  });
});

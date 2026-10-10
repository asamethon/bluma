import { notificationTarget } from '@/features/notifications/utils/notificationTarget';

describe('notificationTarget', () => {
  it.each([
    [{ type: 'follow_request' }, '/profile/follow-requests'],
    [{ type: 'follow_accepted', senderId: 'u1' }, '/user/u1'],
    [{ type: 'message', data: { senderId: 'u2' } }, '/messages/u2'],
    [{ type: 'comment', data: { storyId: 's1', chapterIndex: '2', parentId: 'c1' } }, '/story/s1/comments?chapter=2'],
    [{ type: 'like', data: { storyId: 's1', chapterIndex: '0' } }, '/story/s1?chapter=0'],
    [{ type: 'new_chapter', data: { storyId: 's1', chapterNumber: '3' } }, '/story/s1?chapter=2'],
    [{ type: 'conversation_announcement', data: { conversationId: 'c1' } }, '/conversation/c1'],
    [{ type: 'verify_email' }, '/profile/verify-email'],
    [{ type: 'announcement', data: { tag: 'v3' } }, '/notifications'],
    [{ type: 'writer_nudge', data: { route: '/story/compose/s1?ch=0' } }, '/story/compose/s1?ch=0'],
    [{ data: { storyId: 's1', commentText: 'Yanıt' } }, '/story/s1/comments'],
    [{ data: { storyId: 's1', chapterNumber: '4' } }, '/story/s1?chapter=3'],
  ] as const)('ilgili ekrana yönlendirir: %p', (notification, expected) => {
    expect(notificationTarget(notification)).toEqual({ kind: 'route', value: expected });
  });

  it('bozuk bölüm numarasını güvenli varsayılanla açar', () => {
    expect(notificationTarget({ type: 'new_chapter', data: { storyId: 's1', chapterNumber: 'x' } }))
      .toEqual({ kind: 'route', value: '/story/s1?chapter=0' });
  });

  it('geçersiz duyuru bağlantısı yerine bildirim listesini açar', () => {
    expect(notificationTarget({ type: 'announcement', data: { url: 'javascript:alert(1)', route: '//evil' } }))
      .toEqual({ kind: 'route', value: '/notifications' });
  });
});

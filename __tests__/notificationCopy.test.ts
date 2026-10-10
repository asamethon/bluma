import { localizeNotification } from '@/features/notifications/utils/localizeNotification';

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    exists: () => true,
    t: (key: string) => key,
  },
}));

describe('notification copy', () => {
  it('eski yanıt kaydını hikâye sahibine yazılmış yorum gibi göstermez', () => {
    expect(localizeNotification({
      type: 'comment',
      senderName: 'Ayşe',
      data: { storyTitle: 'Kitap', parentId: 'c1' },
    })).toEqual({
      title: 'notifications.commentReplyTitle',
      message: 'notifications.commentReplyMessage',
    });
  });

  it('doğrudan hikâye yorumunu kendi metniyle gösterir', () => {
    expect(localizeNotification({
      type: 'comment',
      senderName: 'Ayşe',
      data: { storyTitle: 'Kitap' },
    }).message).toBe('notifications.storyCommentMessage');
  });

  it('konuşma yorumunu hikâye yorumu olarak etiketlemez', () => {
    expect(localizeNotification({
      type: 'comment',
      senderName: 'Ayşe',
      data: { conversationId: 'c1', conversationTitle: 'Sohbet' },
    }).message).toBe('notifications.conversationCommentMessage');
  });
});

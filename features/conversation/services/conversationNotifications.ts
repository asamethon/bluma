import { getUserByUsername } from '@/features/auth/services/userByUsername';
import { extractMentions } from '@/features/mentions/utils/mentionQuery';
import i18n from '@/i18n';
import { store } from '@/store';
import { notificationActions } from '@/store/notificationStore';
import type { Notification, User } from '@/types';
import { logger } from '@/utils/logger';
import { collection, doc, getDoc, getDocs, getFirestore, query } from '@react-native-firebase/firestore';

type NotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;

async function conversationContext(conversationId: string) {
  const snapshot = await getDoc(doc(getFirestore(), 'conversations', conversationId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    authorId: data.author?.id || data.authorId,
    title: data.title || i18n.t('conversations.yourConversation'),
  };
}

async function notifyEngagement(conversationId: string, actorId: string, kind: 'like' | 'comment', commentText?: string) {
  try {
    const actor = store.getState().auth.user;
    const context = await conversationContext(conversationId);
    if (!actor || !context || context.authorId === actorId) return;
    const name = actor.displayName || actor.username || i18n.t('notifications.someone');
    const like = kind === 'like';
    const titleKey = like ? 'notifications.newLikeTitle' : 'notifications.newCommentTitle';
    const messageKey = like ? 'notifications.conversationLikedMessage' : 'notifications.conversationCommentMessage';
    const params = { name, conversation: context.title };
    const notification: NotificationInput = {
      userId: context.authorId,
      senderId: actorId,
      type: kind,
      title: i18n.t(titleKey),
      message: i18n.t(messageKey, params),
      data: {
        conversationId,
        conversationTitle: context.title,
        ...(commentText ? { commentText } : {}),
        ...(like ? { likerProfileImage: actor.profileImage } : { commenterProfileImage: actor.profileImage }),
        i18n: { titleKey, messageKey, params },
      },
      isRead: false,
    };
    void notificationActions.createNotification(notification);
  } catch (error) {
    logger.error(`Conversation ${kind} notification error:`, error);
  }
}

export const notifyConversationLike = (conversationId: string, likerId: string) => (
  notifyEngagement(conversationId, likerId, 'like')
);

export const notifyConversationComment = (conversationId: string, commenterId: string, commentText: string) => (
  notifyEngagement(conversationId, commenterId, 'comment', commentText)
);

/**
 * Konuşmada ya da yorumunda `@` ile etiketlenenlere bildirim. Yorumda
 * etiketlenen konuşma sahibi zaten "yorum yaptı" bildirimi aldığı için
 * (`skipAuthor`) ikinci kez rahatsız edilmez. Pano sahibi de `skipUserId` ile
 * atlanır: ona zaten "panona mesaj bırakıldı" bildirimi gidiyor. Bekletilmez.
 */
export async function notifyConversationMentions(
  conversationId: string,
  text: string,
  options: { skipAuthor?: boolean; skipUserId?: string } = {},
) {
  try {
    const actor = store.getState().auth.user;
    const usernames = extractMentions(text);
    if (!actor || !usernames.length) return;
    const context = await conversationContext(conversationId);
    if (!context) return;
    const titleKey = 'notifications.mentionTitle';
    const messageKey = 'notifications.conversationMentionMessage';
    const params = { name: actor.displayName || actor.username || i18n.t('notifications.someone'), conversation: context.title };
    const mentioned = await Promise.all(usernames.map(getUserByUsername));
    const notified = new Set<string>();
    for (const user of mentioned) {
      if (!user?.id || user.id === actor.id || notified.has(user.id)) continue;
      if (options.skipAuthor && user.id === context.authorId) continue;
      if (options.skipUserId && user.id === options.skipUserId) continue;
      notified.add(user.id);
      void notificationActions.createNotification({
        userId: user.id,
        senderId: actor.id,
        type: 'mention',
        title: i18n.t(titleKey),
        message: i18n.t(messageKey, params),
        data: {
          conversationId,
          conversationTitle: context.title,
          commentText: text.slice(0, 200),
          commenterProfileImage: actor.profileImage,
          i18n: { titleKey, messageKey, params },
        },
        isRead: false,
      });
    }
  } catch (error) {
    logger.error('Conversation mention notification error:', error);
  }
}

/**
 * Başkasının panosuna gönderi bırakıldığında pano sahibine. Bekletilmez.
 *
 * Doküman hem `data.i18n` tarifini hem DÜZ `title`/`message` metnini taşır:
 * eski bundle yeni çeviri anahtarını bulamayınca düz metne düşer
 * (localizeNotification). `data.route` de yazılır ki eski sürüm bildirime
 * dokununca doğru ekrana gitsin.
 */
export async function notifyBoardPost(conversationId: string, boardOwnerId: string, actor: User) {
  try {
    if (!boardOwnerId || boardOwnerId === actor.id) return;
    const titleKey = 'notifications.boardPostTitle';
    const messageKey = 'notifications.boardPostMessage';
    const params = { name: actor.displayName || actor.username || i18n.t('notifications.someone') };
    void notificationActions.createNotification({
      userId: boardOwnerId,
      senderId: actor.id,
      type: 'board_post',
      title: i18n.t(titleKey, params),
      message: i18n.t(messageKey, params),
      data: {
        conversationId,
        boardOwnerId,
        authorId: actor.id,
        authorName: actor.displayName || actor.username,
        route: `/conversation/${conversationId}`,
        i18n: { titleKey, messageKey, params },
      },
      isRead: false,
    });
  } catch (error) {
    logger.error('Board post notification error:', error);
  }
}

export async function announceConversationToFollowers(conversationId: string, author: User) {
  try {
    const followers = await getDocs(query(collection(getFirestore(), 'users', author.id, 'followers')));
    const params = { name: author.displayName || author.username || i18n.t('notifications.someone') };
    followers.docs.forEach(follower => {
      if (follower.id === author.id) return;
      void notificationActions.createNotification({
        userId: follower.id,
        senderId: author.id,
        type: 'conversation_announcement',
        title: i18n.t('notifications.newConversationTitle', params),
        message: i18n.t('notifications.newConversationMessage', params),
        data: {
          conversationId,
          authorId: author.id,
          authorName: author.displayName || author.username,
          i18n: {
            titleKey: 'notifications.newConversationTitle',
            messageKey: 'notifications.newConversationMessage',
            params,
          },
        },
        isRead: false,
      });
    });
  } catch (error) {
    logger.error('Announce conversation to followers error:', error);
    throw error;
  }
}

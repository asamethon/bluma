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
    const notification: NotificationInput = {
      userId: context.authorId,
      senderId: actorId,
      type: kind,
      title: i18n.t(like ? 'notifications.newLikeTitle' : 'notifications.newCommentTitle'),
      message: i18n.t(
        like ? 'notifications.conversationLikedMessage' : 'notifications.conversationCommentMessage',
        { name, conversation: context.title },
      ),
      data: {
        conversationId,
        ...(commentText ? { commentText } : {}),
        ...(like ? { likerProfileImage: actor.profileImage } : { commenterProfileImage: actor.profileImage }),
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

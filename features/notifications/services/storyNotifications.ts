import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { collection, doc, getDoc, getDocs, getFirestore } from '@react-native-firebase/firestore';
import { createNotification } from './notificationRepository';

async function profileImage(userId: string) {
  const snapshot = await getDoc(doc(getFirestore(), 'users', userId));
  return snapshot.exists() ? snapshot.data()?.profileImage : undefined;
}

export async function announceStoryToFollowers(
  authorId: string,
  authorName: string,
  storyId: string,
  storyTitle: string,
  kind: 'new_story' | 'new_chapter',
  chapterNumber?: number,
) {
  try {
    const followers = await getDocs(collection(getFirestore(), 'users', authorId, 'followers'));
    const titleKey = kind === 'new_story' ? 'notifications.newStoryTitle' : 'notifications.newChapterTitle';
    const messageKey = kind === 'new_story'
      ? 'notifications.newStoryMessage'
      : chapterNumber ? 'notifications.newChapterMessageNumbered' : 'notifications.newChapterMessage';
    const params = { author: authorName, story: storyTitle, ...(chapterNumber ? { chapter: chapterNumber } : {}) };
    followers.docs.forEach(follower => {
      if (!follower.id || follower.id === authorId) return;
      void createNotification({
        userId: follower.id,
        senderId: authorId,
        type: kind === 'new_story' ? 'story_published' : 'new_chapter',
        title: i18n.t(titleKey),
        message: i18n.t(messageKey, params),
        data: {
          storyId,
          storyTitle,
          ...(chapterNumber ? { chapterNumber: String(chapterNumber) } : {}),
          i18n: { titleKey, messageKey, params },
        },
        isRead: false,
      });
    });
  } catch (error) {
    logger.error('Announce story to followers error:', error);
  }
}

export async function createLikeNotification(
  likerId: string,
  storyOwnerId: string,
  likerName: string,
  storyTitle: string,
  storyId: string,
  isConversation = false,
) {
  try {
    const messageKey = isConversation ? 'notifications.conversationLikedMessage' : 'notifications.storyLikedMessage';
    const params: Record<string, string> = isConversation
      ? { name: likerName, conversation: storyTitle }
      : { name: likerName, story: storyTitle };
    return createNotification({
      userId: storyOwnerId,
      senderId: likerId,
      type: 'like',
      title: i18n.t('notifications.newLikeTitle'),
      message: i18n.t(messageKey, params),
      data: {
        storyId,
        storyTitle,
        likerProfileImage: await profileImage(likerId),
        i18n: { titleKey: 'notifications.newLikeTitle', messageKey, params },
      },
      isRead: false,
    });
  } catch (error) {
    logger.error('Create like notification error:', error);
  }
}

export async function createCommentNotification(
  commenterId: string,
  storyOwnerId: string,
  commenterName: string,
  storyTitle: string,
  storyId: string,
  commentText: string,
) {
  try {
    const params = { name: commenterName, story: storyTitle };
    return createNotification({
      userId: storyOwnerId,
      senderId: commenterId,
      type: 'comment',
      title: i18n.t('notifications.newCommentTitle'),
      message: i18n.t('notifications.storyCommentMessage', params),
      data: {
        storyId,
        storyTitle,
        commentText,
        commenterProfileImage: await profileImage(commenterId),
        i18n: { titleKey: 'notifications.newCommentTitle', messageKey: 'notifications.storyCommentMessage', params },
      },
      isRead: false,
    });
  } catch (error) {
    logger.error('Create comment notification error:', error);
  }
}

export function createWelcomeNotification(userId: string, userName: string) {
  const params = { name: userName };
  return createNotification({
    userId,
    senderId: userId,
    type: 'welcome',
    title: i18n.t('notifications.welcomeTitle'),
    message: i18n.t('notifications.welcomeMessage', params),
    data: { i18n: { titleKey: 'notifications.welcomeTitle', messageKey: 'notifications.welcomeMessage', params } },
    isRead: false,
  });
}

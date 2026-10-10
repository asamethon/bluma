import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { createNotification } from './notificationRepository';

type FollowInput = {
  senderId: string;
  recipientId: string;
  type: 'follow' | 'follow_request' | 'follow_accepted';
  titleKey: string;
  messageKey: string;
  params: Record<string, string | number>;
};

async function createFollowStyleNotification(input: FollowInput) {
  try {
    const snapshot = await getDoc(doc(getFirestore(), 'users', input.senderId));
    const profileImage = snapshot.exists() ? snapshot.data()?.profileImage : undefined;
    return createNotification({
      userId: input.recipientId,
      senderId: input.senderId,
      type: input.type,
      title: i18n.t(input.titleKey),
      message: i18n.t(input.messageKey, input.params),
      data: {
        followerId: input.senderId,
        ...(profileImage ? { followerProfileImage: profileImage } : {}),
        i18n: { titleKey: input.titleKey, messageKey: input.messageKey, params: input.params },
      },
      isRead: false,
    });
  } catch (error) {
    logger.error('Create follow notification error:', error);
  }
}

export const createFollowNotification = (followerId: string, followedUserId: string, followerName: string) => (
  createFollowStyleNotification({
    senderId: followerId,
    recipientId: followedUserId,
    type: 'follow',
    titleKey: 'notifications.newFollowerTitle',
    messageKey: 'notifications.newFollowerMessage',
    params: { name: followerName },
  })
);

export const createFollowRequestNotification = (requesterId: string, targetUserId: string, requesterName: string) => (
  createFollowStyleNotification({
    senderId: requesterId,
    recipientId: targetUserId,
    type: 'follow_request',
    titleKey: 'notifications.followRequestTitle',
    messageKey: 'notifications.followRequestMessage',
    params: { name: requesterName },
  })
);

export const createFollowAcceptedNotification = (ownerId: string, requesterId: string, ownerName: string) => (
  createFollowStyleNotification({
    senderId: ownerId,
    recipientId: requesterId,
    type: 'follow_accepted',
    titleKey: 'notifications.followAcceptedTitle',
    messageKey: 'notifications.followAcceptedMessage',
    params: { name: ownerName },
  })
);

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import i18n from '@/i18n';
import { notificationActions } from '../../../store/notificationStore';
import { getStoryById } from './storyApi';
import { logger } from '@/utils/logger';

function chapterRef(storyId: string, chapterIndex: number) {
  return doc(getFirestore(), 'stories', storyId, 'chapters', String(chapterIndex));
}

async function isChapterLiked(storyId: string, chapterIndex: number): Promise<boolean> {
  const { user } = store.getState().auth;
  if (!user?.id) return false;
  const snap = await getDoc(doc(collection(chapterRef(storyId, chapterIndex), 'likes'), user.id));
  return snap.exists();
}

async function toggleChapterLike(storyId: string, chapterIndex: number, wasLiked: boolean) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false };

  try {
    const likeRef = doc(collection(chapterRef(storyId, chapterIndex), 'likes'), user.id);
    if (wasLiked) {
      await deleteDoc(likeRef);
      await updateDoc(chapterRef(storyId, chapterIndex), { likesCount: increment(-1) });
    } else {
      await setDoc(likeRef, { userId: user.id, createdAt: serverTimestamp() });
      await updateDoc(chapterRef(storyId, chapterIndex), { likesCount: increment(1) });

      const story = await getStoryById(storyId);
      if (story && story.authorId !== user.id) {
        // Metin okuyanın dilinde üretilsin diye tarif dokümana yazılır.
        const params = {
          name: user.displayName || user.username || i18n.t('notifications.someone'),
          story: story.title,
          chapter: chapterIndex + 1,
        };
        notificationActions.createNotification({
          userId: story.authorId,
          senderId: user.id,
          type: 'like',
          title: i18n.t('notifications.chapterLikedTitle'),
          message: i18n.t('notifications.chapterLikedMessage', params),
          data: {
            storyId,
            chapterIndex: String(chapterIndex),
            i18n: {
              titleKey: 'notifications.chapterLikedTitle',
              messageKey: 'notifications.chapterLikedMessage',
              params,
            },
          },
          isRead: false,
        }).catch(() => {});
      }
    }
    return { success: true };
  } catch (error) {
    logger.error('Toggle chapter like error:', error);
    return { success: false };
  }
}

export const chapterLikesActions = { isChapterLiked, toggleChapterLike };

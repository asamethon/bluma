import { setLikeState } from '@/lib/likeToggle';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
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

/**
 * Bölüm beğenisi. Arayüz durumu okuyucu hook'unda tutulduğu için istenen
 * durum dışarıdan gelir; dokunuşlar bölüm başına birleşir ve kayıt ile sayaç
 * tek transaction'da yazılır.
 */
async function toggleChapterLike(storyId: string, chapterIndex: number, wasLiked: boolean) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false };
  const userId = user.id;

  try {
    const chapter = chapterRef(storyId, chapterIndex);
    const outcome = await setLikeState({
      key: `chapter:${storyId}:${chapterIndex}`,
      userId,
      desired: !wasLiked,
      previous: wasLiked,
      targets: {
        counter: chapter,
        like: doc(collection(chapter, 'likes'), userId),
      },
      onLiked: () => void notifyChapterAuthor(storyId, chapterIndex),
    });
    return { success: outcome.ok };
  } catch (error) {
    logger.error('Toggle chapter like error:', error);
    return { success: false };
  }
}

async function notifyChapterAuthor(storyId: string, chapterIndex: number) {
  const { user } = store.getState().auth;
  if (!user?.id) return;
  try {
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
  } catch (error) {
    logger.error('Chapter like notification error:', error);
  }
}

export const chapterLikesActions = { isChapterLiked, toggleChapterLike };

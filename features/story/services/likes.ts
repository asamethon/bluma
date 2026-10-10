import i18n from '@/i18n';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { notificationActions } from '@/store/notificationStore';
import { applyLikeDelta, setLikedOptimistically } from './likes/likeState';
import { getStoryById } from './storyApi';

function likeRefs(storyId: string, userId: string) {
  const firestore = getFirestore();
  return {
    story: doc(firestore, 'stories', storyId),
    like: doc(firestore, 'stories', storyId, 'likes', userId),
    userLike: doc(firestore, 'users', userId, 'likedStories', storyId),
  };
}

type LikeResult = { success: boolean; error?: string };

const isLiked = (storyId: string) =>
  store.getState().story.likedStories.some(story => story.id === storyId);

/**
 * İyimser beğeni (akış ve okuyucu): arayüz anında döner, yazma arka planda
 * sürer, hata olursa sessizce geri alınır — kullanıcı satırın eski hâline
 * döndüğünü zaten görür.
 */
async function likeStory(storyId: string): Promise<LikeResult> {
  const userId = store.getState().auth.user?.id;
  if (!userId) return { success: false, error: i18n.t('errors.loginRequired') };

  const liked = !isLiked(storyId);
  applyLikeDelta(storyId, liked ? 1 : -1);
  setLikedOptimistically(storyId, liked);
  void writeLike(storyId, userId, liked);
  return { success: true };
}

/**
 * Favorilerden çıkarma: kullanıcı onay verdiği için sonucu BEKLERİZ ve gerçek
 * sonucu döneriz; ekran başarı/başarısızlık mesajını buna göre gösterir.
 */
async function unlikeStory(storyId: string): Promise<LikeResult> {
  const userId = store.getState().auth.user?.id;
  if (!userId) return { success: false, error: i18n.t('errors.loginRequired') };
  if (!isLiked(storyId)) return { success: true };

  applyLikeDelta(storyId, -1);
  setLikedOptimistically(storyId, false);
  const written = await writeLike(storyId, userId, false);
  return written ? { success: true } : { success: false, error: i18n.t('story.likeFailed') };
}

/** Yazma başarılıysa true; hata durumunda iyimser değişikliği geri alır. */
async function writeLike(storyId: string, userId: string, liked: boolean): Promise<boolean> {
  const refs = likeRefs(storyId, userId);
  try {
    await Promise.all(
      liked
        ? [
            setDoc(refs.like, { userId, createdAt: serverTimestamp() }),
            setDoc(refs.userLike, { storyId, createdAt: serverTimestamp() }),
            updateDoc(refs.story, { likesCount: increment(1) }),
          ]
        : [
            deleteDoc(refs.like),
            deleteDoc(refs.userLike),
            updateDoc(refs.story, { likesCount: increment(-1) }),
          ],
    );
    if (liked) notifyAuthor(storyId, userId).catch(error => logger.error('Like notification error:', error));
    return true;
  } catch (error) {
    logger.error('Like write error:', error);
    applyLikeDelta(storyId, liked ? -1 : 1);
    setLikedOptimistically(storyId, !liked);
    return false;
  }
}

async function notifyAuthor(storyId: string, userId: string) {
  const user = store.getState().auth.user;
  const story = await getStoryById(storyId);
  if (!user || !story || story.authorId === userId) return;
  await notificationActions.createLikeNotification(
    userId,
    story.authorId,
    user.displayName || user.username || i18n.t('notifications.someone'),
    story.title,
    storyId,
    false,
  );
}

/** Favoriler listesini sunucudan tazeler. */
async function loadLikedStories() {
  const userId = store.getState().auth.user?.id;
  if (!userId) return;
  try {
    const snapshot = await getDocs(
      query(collection(getFirestore(), 'users', userId, 'likedStories'), orderBy('createdAt', 'desc')),
    );
    const stories = await Promise.all(snapshot.docs.map(like => getStoryById(like.data().storyId)));
    store.dispatch(patchStory({ likedStories: stories.filter((story): story is Story => !!story) }));
  } catch (error) {
    logger.error('Load liked stories error:', error);
  }
}

export const likesActions = {
  likeStory,
  unlikeStory,
  loadLikedStories,
  refreshLikedStoriesState: loadLikedStories,
};

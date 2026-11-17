import i18n from '@/i18n';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { setLikeState } from '@/lib/likeToggle';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from '@react-native-firebase/firestore';
import { notificationActions } from '@/store/notificationStore';
import { applyLikeDelta, setLikedOptimistically } from './likes/likeState';
import { getStoryForShelf } from './storyReads';

function likeRefs(storyId: string, userId: string) {
  const firestore = getFirestore();
  return {
    counter: doc(firestore, 'stories', storyId),
    like: doc(firestore, 'stories', storyId, 'likes', userId),
    userLike: doc(firestore, 'users', userId, 'likedStories', storyId),
    userLikeData: { storyId },
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

  const previous = isLiked(storyId);
  applyLikeDelta(storyId, previous ? -1 : 1);
  setLikedOptimistically(storyId, !previous);
  void writeLike(storyId, userId, !previous, previous);
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
  const written = await writeLike(storyId, userId, false, true);
  return written ? { success: true } : { success: false, error: i18n.t('story.likeFailed') };
}

/**
 * Yazma başarılıysa true. Dokunuşlar hikâye başına birleşir; hata olursa
 * arayüz, zincir başlamadan önceki duruma döner (ters çevirme yok).
 */
async function writeLike(
  storyId: string,
  userId: string,
  desired: boolean,
  previous: boolean,
): Promise<boolean> {
  const outcome = await setLikeState({
    key: `story:${storyId}`,
    userId,
    desired,
    previous,
    targets: likeRefs(storyId, userId),
    onLiked: () => {
      void trackLikeChallenge(userId);
      notifyAuthor(storyId, userId).catch(error => logger.error('Like notification error:', error));
    },
  });
  if (!outcome.ok && outcome.desired !== outcome.previous) {
    applyLikeDelta(storyId, outcome.previous ? 1 : -1);
    setLikedOptimistically(storyId, outcome.previous);
  }
  return outcome.ok;
}

async function trackLikeChallenge(userId: string) {
  try {
    const { challengeActions } = await import('@/features/challenges/services/challengeProgress');
    await challengeActions.trackAction(userId, 'storyLikes');
  } catch {
    // Görev takibi beğeniyi bloklamaz.
  }
}

async function notifyAuthor(storyId: string, userId: string) {
  const user = store.getState().auth.user;
  const story = await getStoryForShelf(storyId);
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
    const stories = await Promise.all(snapshot.docs.map(like => getStoryForShelf(like.data().storyId)));
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

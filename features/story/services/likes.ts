import { Story } from '@/types';
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { notificationActions } from '../../../store/notificationStore';
import { getStoryById } from './storyApi';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

export async function likeStory(storyId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error(i18n.t('errors.loginRequired'));
    }

    const wasLiked = store.getState().story.likedStories.some(s => s.id === storyId);

    const findStory = (): Story | undefined =>
      store.getState().story.stories.find(s => s.id === storyId) ||
      store.getState().story.discoverStories.find(s => s.id === storyId) ||
      store.getState().story.followingStories.find(s => s.id === storyId) ||
      (store.getState().story.currentStory?.id === storyId ? store.getState().story.currentStory! : undefined);

    applyLikeDelta(storyId, wasLiked ? -1 : 1);

    if (wasLiked) {
      store.dispatch(patchStory({ likedStories: store.getState().story.likedStories.filter(s => s.id !== storyId) }));
    } else {
      const story = findStory();
      if (story) {
        store.dispatch(patchStory({
          likedStories: store.getState().story.likedStories.some(s => s.id === storyId)
            ? store.getState().story.likedStories
            : [{ ...story, likesCount: (story.likesCount || 0) + 1 }, ...store.getState().story.likedStories]
        }));
      }
    }

    performLikeStoryFirebaseOperation(storyId, user.id);

    return { success: true };
  } catch (error) {
    logger.error('Like story error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('story.likeFailed') };
  }
}

export function applyLikeDelta(storyId: string, delta: number) {
  const upd = (arr: Story[]) =>
    arr.map(s => s.id === storyId ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) + delta) } : s);
  const { stories, discoverStories, followingStories } = store.getState().story;
  store.dispatch(patchStory({
    stories: upd(stories),
    discoverStories: upd(discoverStories),
    followingStories: upd(followingStories),
  }));
  const cur = store.getState().story.currentStory;
  if (cur && cur.id === storyId) {
    store.dispatch(patchStory({ currentStory: { ...cur, likesCount: Math.max(0, (cur.likesCount || 0) + delta) } }));
  }
}

export async function performLikeStoryFirebaseOperation(storyId: string, userId: string) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);
    const likesRef = collection(firestore, 'stories', storyId, 'likes');
    const userLikedRef = collection(firestore, 'users', userId, 'likedStories');

    const likeDocs = await getDocs(query(likesRef, where('userId', '==', userId)));

    if (!likeDocs.empty) {
      const userLikedDocs = await getDocs(query(userLikedRef, where('storyId', '==', storyId)));
      await Promise.all([
        ...likeDocs.docs.map(d => deleteDoc(d.ref)),
        ...userLikedDocs.docs.map(d => deleteDoc(d.ref)),
        updateDoc(storyRef, { likesCount: increment(-1) }),
      ]);
    } else {
      await Promise.all([
        setDoc(doc(likesRef, userId), { userId, createdAt: serverTimestamp() }),
        setDoc(doc(userLikedRef, storyId), { storyId, createdAt: serverTimestamp() }),
        updateDoc(storyRef, { likesCount: increment(1) }),
      ]);

      sendLikeNotification(storyId, userId);
    }
  } catch (error) {
    logger.error('Firebase like operation error:', error);
    refreshLikedStoriesState();
    updateStoryLikesCount(storyId);
  }
}

export async function sendLikeNotification(storyId: string, userId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user) return;

    const storyData = await getStoryById(storyId);
    if (storyData && storyData.authorId !== userId) {
      notificationActions.createLikeNotification(
        userId,
        storyData.authorId,
        user.displayName || user.username || i18n.t('notifications.someone'),
        storyData.title,
        storyId,
        false
      ).catch(error => {
        logger.error('Story like notification error:', error);
      });
    }
  } catch (error) {
    logger.error('Send like notification error:', error);
  }
}

export function revertLikeStoryUI(storyId: string) {
  const currentStories = store.getState().story.stories;
  const storyIndex = currentStories.findIndex(s => s.id === storyId);

  if (storyIndex !== -1) {
    const story = currentStories[storyIndex];
    const isCurrentlyLiked = store.getState().story.likedStories.some(s => s.id === storyId);

    if (isCurrentlyLiked) {
      store.dispatch(patchStory({
        stories: store.getState().story.stories.map(s => s.id === storyId
          ? { ...s, likesCount: (s.likesCount || 0) + 1 }
          : s
        )
      }));
      store.dispatch(patchStory({ likedStories: [...store.getState().story.likedStories, story] }));
    } else {
      store.dispatch(patchStory({
        stories: store.getState().story.stories.map(s => s.id === storyId
          ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) - 1) }
          : s
        )
      }));
      store.dispatch(patchStory({ likedStories: store.getState().story.likedStories.filter(s => s.id !== storyId) }));
    }
  }
}

export async function isStoryLiked(storyId: string): Promise<boolean> {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return false;

    const likedStories = store.getState().story.likedStories;
    return likedStories.some(story => story.id === storyId);
  } catch (error) {
    logger.error('Check story like error:', error);
    return false;
  }
}

export async function updateStoryLikesCount(storyId: string) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    const countSnap = await getCountFromServer(collection(firestore, 'stories', storyId, 'likes'));
    const realLikesCount = countSnap.data().count;

    await updateDoc(storyRef, { likesCount: realLikesCount });

    store.dispatch(patchStory({
      stories: store.getState().story.stories.map(s => s.id === storyId
        ? { ...s, likesCount: realLikesCount }
        : s
      )
    }));
  } catch (error) {
    logger.error('Update story likes count error:', error);
  }
}

export async function refreshLikedStoriesState() {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return;

    const firestore = getFirestore();
    const likesQuery = query(
      collection(firestore, 'users', user.id, 'likedStories'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(likesQuery);
    const fetched = await Promise.all(
      snapshot.docs.map(likeDoc => getStoryById(likeDoc.data().storyId))
    );
    store.dispatch(patchStory({ likedStories: fetched.filter((s): s is Story => !!s) }));
  } catch (error) {
    logger.error('Refresh liked stories state error:', error);
  }
}

export async function loadLikedStories() {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return;

    const firestore = getFirestore();
    const likesQuery = query(
      collection(firestore, 'users', user.id, 'likedStories'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(likesQuery);
    const fetched = await Promise.all(
      snapshot.docs.map(likeDoc => getStoryById(likeDoc.data().storyId))
    );
    store.dispatch(patchStory({ likedStories: fetched.filter((s): s is Story => !!s) }));
  } catch (error) {
    logger.error('Load liked stories error:', error);
  }
}

export const likesActions = {
  likeStory,
  applyLikeDelta,
  performLikeStoryFirebaseOperation,
  sendLikeNotification,
  revertLikeStoryUI,
  isStoryLiked,
  updateStoryLikesCount,
  refreshLikedStoriesState,
  loadLikedStories,
};

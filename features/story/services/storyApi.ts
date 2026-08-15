import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { Story } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    serverTimestamp,
    updateDoc,
    where,
    query,
    writeBatch,
} from '@react-native-firebase/firestore';
import { notificationActions } from '../../../store/notificationStore';
import { getUserById } from './userCache';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

export async function createStory(storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount' | 'author'>) {
  try {
    store.dispatch(patchStory({ isLoading: true }));
    const { user } = store.getState().auth;

    if (!user?.id) {
      throw new Error(i18n.t('errors.loginRequired'));
    }

    const firestore = getFirestore();
    const storiesRef = collection(firestore, 'stories');

    const cleanStoryData = Object.fromEntries(
      Object.entries(storyData).filter(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return false;
        }
        if (Array.isArray(value) && value.length === 0) {
          return false;
        }
        return true;
      })
    );

    const newStory = {
      language: i18n.language,
      ...cleanStoryData,
      authorId: user.id,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(storiesRef, newStory);

    if (storyData.isPublished) {
      await updateUserStoriesCount(user.id, 1);

      notificationActions.announceStoryToFollowers(
        user.id,
        user.displayName || user.username || i18n.t('notifications.anAuthorYouFollow'),
        docRef.id,
        storyData.title,
        'new_story'
      ).catch(() => {});

      logEvent(getAnalytics(), 'story_publish', { story_id: docRef.id }).catch(() => {});
    }

    store.dispatch(patchStory({ isLoading: false }));
    return { success: true, storyId: docRef.id };
  } catch (error) {
    logger.error('Create story error:', error);
    store.dispatch(patchStory({ isLoading: false }));
    store.dispatch(patchStory({ error: error instanceof Error ? error.message : i18n.t('story.createFailed') }));
    return { success: false, error: error instanceof Error ? error.message : i18n.t('story.createFailed') };
  }
}

export async function updateStory(storyId: string, updates: Partial<Story>) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    const storyDoc = await getDoc(storyRef);
    if (!storyDoc.exists()) {
      throw new Error(i18n.t('story.notFound'));
    }

    const currentStoryData = storyDoc.data() as Story;

    await updateDoc(storyRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    if (updates.isPublished && !currentStoryData.isPublished) {
      await updateUserStoriesCount(currentStoryData.authorId, 1);
    }

    const { user } = store.getState().auth;
    if (user?.id === currentStoryData.authorId) {
      const authorName = user.displayName || user.username || i18n.t('notifications.anAuthorYouFollow');
      const title = updates.title || currentStoryData.title;
      const becamePublished = updates.isPublished === true && !currentStoryData.isPublished;
      const staysPublished = currentStoryData.isPublished && updates.isPublished !== false;
      const chapterAdded =
        typeof updates.chaptersCount === 'number' &&
        updates.chaptersCount > (currentStoryData.chaptersCount || 1);

      if (becamePublished) {
        notificationActions.announceStoryToFollowers(
          user.id, authorName, storyId, title, 'new_story'
        ).catch(() => {});
        logEvent(getAnalytics(), 'story_publish', { story_id: storyId }).catch(() => {});
      } else if (staysPublished && chapterAdded) {
        notificationActions.announceStoryToFollowers(
          user.id, authorName, storyId, title, 'new_chapter', updates.chaptersCount
        ).catch(() => {});
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Update story error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('story.updateFailed') };
  }
}

export async function deleteStory(storyId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error(i18n.t('errors.loginRequired'));
    }

    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    const storyDoc = await getDoc(storyRef);
    if (!storyDoc.exists()) {
      return { success: false, error: i18n.t('story.notFound') };
    }
    const wasPublished = (storyDoc.data() as Story).isPublished;

    const refsToDelete: any[] = [];

    const likesSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'likes'));
    refsToDelete.push(...likesSnapshot.docs.map((d: any) => d.ref));

    const viewsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'views'));
    refsToDelete.push(...viewsSnapshot.docs.map((d: any) => d.ref));

    const chaptersSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'chapters'));
    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapterLikes = await getDocs(collection(firestore, 'stories', storyId, 'chapters', chapterDoc.id, 'likes'));
      refsToDelete.push(...chapterLikes.docs.map((d: any) => d.ref));
      refsToDelete.push(chapterDoc.ref);
    }

    const commentsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'comments'));
    for (const commentDoc of commentsSnapshot.docs) {
      const commentLikes = await getDocs(collection(firestore, 'stories', storyId, 'comments', commentDoc.id, 'likes'));
      refsToDelete.push(...commentLikes.docs.map((d: any) => d.ref));
      refsToDelete.push(commentDoc.ref);
    }

    for (let i = 0; i < refsToDelete.length; i += 500) {
      const batch = writeBatch(firestore);
      refsToDelete.slice(i, i + 500).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    await deleteDoc(storyRef);

    if (wasPublished) {
      await updateUserStoriesCount(user.id, -1);
    }

    return { success: true };
  } catch (error) {
    logger.error('Delete story error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('story.deleteFailed') };
  }
}

export async function getStoryById(storyId: string): Promise<Story | null> {
  try {
    if (!storyId || typeof storyId !== 'string') return null;
    const firestore = getFirestore();
    const storySnap = await getDoc(doc(firestore, 'stories', storyId));

    if (storySnap.exists()) {
      const storyData = storySnap.data() as Story;
      const author = await getUserById(storyData.authorId);

      return {
        ...storyData,
        id: storySnap.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      };
    }

    return null;
  } catch (error: any) {
    if (error?.code === 'firestore/permission-denied') {
      logger.debug('Get story skipped (no longer accessible, non-critical):', storyId);
    } else {
      logger.error('Get story error:', error);
    }
    return null;
  }
}

export async function loadUserStories(userId: string) {
  try {
    store.dispatch(patchStory({ isLoading: true }));
    const firestore = getFirestore();
    const storiesQuery = query(
      collection(firestore, 'stories'),
      where('authorId', '==', userId)
    );

    const snapshot = await getDocs(storiesQuery);
    const stories: Story[] = [];

    for (const storyDoc of snapshot.docs) {
      const storyData = storyDoc.data() as Story;
      const author = await getUserById(storyData.authorId);

      stories.push({
        ...storyData,
        id: storyDoc.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      });
    }

    stories.sort((a, b) => {
      const dateA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
        ? (a.createdAt as any).toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
        ? (b.createdAt as any).toDate()
        : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    store.dispatch(patchStory({ userStories: stories }));
  } catch (error) {
    logger.error('Load user stories error:', error);
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}

export async function loadPublishedUserStories(userId: string) {
  try {
    store.dispatch(patchStory({ isLoading: true }));
    const firestore = getFirestore();
    const storiesQuery = query(
      collection(firestore, 'stories'),
      where('authorId', '==', userId),
      where('isPublished', '==', true)
    );

    const snapshot = await getDocs(storiesQuery);
    const stories: Story[] = [];

    for (const storyDoc of snapshot.docs) {
      const storyData = storyDoc.data() as Story;
      const author = await getUserById(storyData.authorId);

      stories.push({
        ...storyData,
        id: storyDoc.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      });
    }

    stories.sort((a, b) => {
      const dateA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
        ? (a.createdAt as any).toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
        ? (b.createdAt as any).toDate()
        : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return stories;
  } catch (error) {
    logger.error('Load published user stories error:', error);
    return [];
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}

export async function updateUserStoriesCount(userId: string, delta: number) {
  try {
    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      storiesCount: increment(delta),
    });
  } catch (error) {
    logger.error('Update user stories count error:', error);
  }
}

export const storyApiActions = {
  createStory,
  updateStory,
  deleteStory,
  getStoryById,
  loadUserStories,
  loadPublishedUserStories,
  updateUserStoriesCount,
};

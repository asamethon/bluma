import { Story } from '@/types';
import i18n from '@/i18n';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from '@react-native-firebase/firestore';
import { getStoryById } from './storyApi';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';
import { logger } from '@/utils/logger';

async function saveStory(storyId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error(i18n.t('errors.loginRequired'));
    }

    const currentStories = store.getState().story.stories;
    const story = currentStories.find(s => s.id === storyId);
    const isCurrentlySaved = store.getState().story.savedStories.some(s => s.id === storyId);

    if (isCurrentlySaved) {
      store.dispatch(patchStory({ savedStories: store.getState().story.savedStories.filter(s => s.id !== storyId) }));
    } else {
      if (story) {
        store.dispatch(patchStory({ savedStories: [...store.getState().story.savedStories, story] }));
      }
    }

    performSaveStoryFirebaseOperation(storyId, user.id);

    return { success: true };
  } catch (error) {
    logger.error('Save story error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('saved.saveFailed') };
  }
}

async function performSaveStoryFirebaseOperation(storyId: string, userId: string) {
  try {
    const firestore = getFirestore();
    const savesRef = collection(firestore, 'users', userId, 'savedStories');
    const saveRef = doc(savesRef, storyId);

    const saveDocs = await getDocs(query(savesRef, where('storyId', '==', storyId)));

    if (!saveDocs.empty) {
      await Promise.all(saveDocs.docs.map(d => deleteDoc(d.ref)));
    } else {
      await setDoc(saveRef, {
        storyId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('Firebase save operation error:', error);
    revertSaveStoryUI(storyId);
  }
}

function revertSaveStoryUI(storyId: string) {
  const isCurrentlySaved = store.getState().story.savedStories.some(s => s.id === storyId);
  const currentStories = store.getState().story.stories;
  const story = currentStories.find(s => s.id === storyId);

  if (isCurrentlySaved) {
    if (story) {
      store.dispatch(patchStory({ savedStories: [...store.getState().story.savedStories, story] }));
    }
  } else {
    store.dispatch(patchStory({ savedStories: store.getState().story.savedStories.filter(s => s.id !== storyId) }));
  }
}

async function isStorySaved(storyId: string): Promise<boolean> {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return false;

    const savedStories = store.getState().story.savedStories;
    const isSaved = savedStories.some(story => story.id === storyId);

    if (savedStories.length > 0) {
      return isSaved;
    }

    const firestore = getFirestore();
    const savesQuery = query(
      collection(firestore, 'users', user.id, 'savedStories'),
      where('storyId', '==', storyId)
    );

    const snapshot = await getDocs(savesQuery);
    return !snapshot.empty;
  } catch (error) {
    logger.error('Check story save error:', error);
    return false;
  }
}

async function loadSavedStories() {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return;

    const firestore = getFirestore();
    const savesQuery = query(
      collection(firestore, 'users', user.id, 'savedStories'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(savesQuery);
    const fetched = await Promise.all(
      snapshot.docs.map(saveDoc => getStoryById(saveDoc.data().storyId))
    );
    store.dispatch(patchStory({ savedStories: fetched.filter((s): s is Story => !!s) }));
  } catch (error) {
    logger.error('Load saved stories error:', error);
  }
}

export const savesActions = {
  saveStory,
  performSaveStoryFirebaseOperation,
  revertSaveStoryUI,
  isStorySaved,
  loadSavedStories,
};

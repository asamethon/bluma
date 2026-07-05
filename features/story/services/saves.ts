import { Story } from '@/types';
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

// Save/Unsave story
export async function saveStory(storyId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Önce UI'yi hemen güncelle (optimistic update)
    const currentStories = store.getState().story.stories;
    const story = currentStories.find(s => s.id === storyId);
    const isCurrentlySaved = store.getState().story.savedStories.some(s => s.id === storyId);

    if (isCurrentlySaved) {
      // Unsave - UI'yi hemen güncelle
      store.dispatch(patchStory({ savedStories: store.getState().story.savedStories.filter(s => s.id !== storyId) }));
    } else {
      // Save - UI'yi hemen güncelle
      if (story) {
        store.dispatch(patchStory({ savedStories: [...store.getState().story.savedStories, story] }));
      }
    }

    // Firebase işlemlerini arka planda yap
    performSaveStoryFirebaseOperation(storyId, user.id);

    return { success: true };
  } catch (error) {
    console.error('Save story error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Save operation failed' };
  }
}

// Firebase save işlemlerini arka planda yap.
// Kayıt dokümanı deterministik ID kullanır (savedStories/{storyId}) —
// eski sürümler addDoc ile rastgele ID yazdığından, geri alma her iki
// formattaki kayıtları da siler (aksi hâlde kayıt sunucuda kalıyordu).
export async function performSaveStoryFirebaseOperation(storyId: string, userId: string) {
  try {
    const firestore = getFirestore();
    const savesRef = collection(firestore, 'users', userId, 'savedStories');
    const saveRef = doc(savesRef, storyId);

    // Check if already saved (matches both id formats via the storyId field)
    const saveDocs = await getDocs(query(savesRef, where('storyId', '==', storyId)));

    if (!saveDocs.empty) {
      // Unsave — legacy rastgele ID'li kayıtlar dahil hepsini sil
      await Promise.all(saveDocs.docs.map(d => deleteDoc(d.ref)));
    } else {
      // Save
      await setDoc(saveRef, {
        storyId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Firebase save operation error:', error);
    // Hata durumunda UI'yi geri al
    revertSaveStoryUI(storyId);
  }
}

// UI'yi geri al (hata durumunda)
export function revertSaveStoryUI(storyId: string) {
  const isCurrentlySaved = store.getState().story.savedStories.some(s => s.id === storyId);
  const currentStories = store.getState().story.stories;
  const story = currentStories.find(s => s.id === storyId);

  if (isCurrentlySaved) {
    // Geri al: unsave yapılmışsa save'a çevir
    if (story) {
      store.dispatch(patchStory({ savedStories: [...store.getState().story.savedStories, story] }));
    }
  } else {
    // Geri al: save yapılmışsa unsave'a çevir
    store.dispatch(patchStory({ savedStories: store.getState().story.savedStories.filter(s => s.id !== storyId) }));
  }
}

export async function isStorySaved(storyId: string): Promise<boolean> {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return false;

    // Önce local state'i kontrol et (daha hızlı)
    const savedStories = store.getState().story.savedStories;
    const isSaved = savedStories.some(story => story.id === storyId);

    if (savedStories.length > 0) {
      return isSaved;
    }

    // Local state boşsa Firebase'den kontrol et
    const firestore = getFirestore();
    const savesQuery = query(
      collection(firestore, 'users', user.id, 'savedStories'),
      where('storyId', '==', storyId)
    );

    const snapshot = await getDocs(savesQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Check story save error:', error);
    return false;
  }
}

export async function loadSavedStories() {
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
    console.error('Load saved stories error:', error);
  }
}

export const savesActions = {
  saveStory,
  performSaveStoryFirebaseOperation,
  revertSaveStoryUI,
  isStorySaved,
  loadSavedStories,
};

import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import { logger } from '@/utils/logger';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { storyFromSnapshot } from './storySnapshot';

export function setupStoryDetailListener(storyId: string) {
  try {
    return onSnapshot(doc(getFirestore(), 'stories', storyId), snapshot => {
      if (!snapshot.exists()) return;
      void storyFromSnapshot(snapshot).then(currentStory => store.dispatch(patchStory({ currentStory })));
    }, error => logger.error('Story detail listener error:', error));
  } catch (error) {
    logger.error('Setup story detail listener error:', error);
  }
}

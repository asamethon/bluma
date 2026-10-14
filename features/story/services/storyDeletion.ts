import i18n from '@/i18n';
import { store } from '@/store';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, writeBatch } from '@react-native-firebase/firestore';
import { applyStoryChange } from './listeners/storyFeedListeners';
import { forgetStory } from './storyCache';
import { updateUserStoriesCount } from './storyMutations';

async function nestedReferences(storyId: string, group: 'chapters' | 'comments') {
  const db = getFirestore();
  const documents = await getDocs(collection(db, 'stories', storyId, group));
  return Promise.all(documents.docs.map(async item => {
    const likes = await getDocs(collection(db, 'stories', storyId, group, item.id, 'likes'));
    return [...likes.docs.map(like => like.ref), item.ref];
  }));
}

async function deleteReferences(references: any[]) {
  const db = getFirestore();
  const chunks = Array.from({ length: Math.ceil(references.length / 500) }, (_, index) => (
    references.slice(index * 500, (index + 1) * 500)
  ));
  await Promise.all(chunks.map(async chunk => {
    const batch = writeBatch(db);
    chunk.forEach(reference => batch.delete(reference));
    await batch.commit();
  }));
}

export async function deleteStory(storyId: string) {
  try {
    const userId = store.getState().auth.user?.id;
    if (!userId) throw new Error(i18n.t('errors.loginRequired'));
    const db = getFirestore();
    const reference = doc(db, 'stories', storyId);
    const story = await getDoc(reference);
    if (!story.exists()) return { success: false, error: i18n.t('story.notFound') };
    const [likes, views, chapters, comments] = await Promise.all([
      getDocs(collection(db, 'stories', storyId, 'likes')),
      getDocs(collection(db, 'stories', storyId, 'views')),
      nestedReferences(storyId, 'chapters'),
      nestedReferences(storyId, 'comments'),
    ]);
    await deleteReferences([
      ...likes.docs.map(item => item.ref),
      ...views.docs.map(item => item.ref),
      ...chapters.flat(),
      ...comments.flat(),
    ]);
    await deleteDoc(reference);
    forgetStory(storyId);
    applyStoryChange(storyId, null);
    if ((story.data() as Story).isPublished) await updateUserStoriesCount(userId, -1);
    return { success: true };
  } catch (error) {
    logger.error('Delete story error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('story.deleteFailed') };
  }
}

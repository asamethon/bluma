import i18n from '@/i18n';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { addStoryToList, removeList, removeStoryFromList, updateList, upsertList } from '@/store/slices/readingListSlice';
import { logger } from '@/utils/logger';
import { listsRef } from './readingListRefs';
import { loadLists } from './readingListQueries';

export async function createList(name: string, opts?: { description?: string; isPublic?: boolean }) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: i18n.t('lists.nameEmpty') };
  try {
    const ref = await addDoc(listsRef(user.id), {
      name: trimmed,
      description: opts?.description?.trim() || '',
      isPublic: opts?.isPublic !== false,
      storyIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    store.dispatch(upsertList({
      id: ref.id,
      name: trimmed,
      description: opts?.description || '',
      isPublic: opts?.isPublic !== false,
      storyIds: [],
    }));
    return { success: true, listId: ref.id };
  } catch (error) {
    logger.error('Create reading list error:', error);
    return { success: false, error: i18n.t('lists.createFailed') };
  }
}

export async function renameList(listId: string, name: string) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: i18n.t('lists.nameEmpty') };
  try {
    await updateDoc(doc(listsRef(user.id), listId), { name: trimmed, updatedAt: serverTimestamp() });
    store.dispatch(updateList({ listId, patch: { name: trimmed } }));
    return { success: true };
  } catch (error) {
    logger.error('Rename reading list error:', error);
    return { success: false, error: i18n.t('lists.updateFailed') };
  }
}

export async function deleteList(listId: string) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
  try {
    await deleteDoc(doc(listsRef(user.id), listId));
    store.dispatch(removeList(listId));
    return { success: true };
  } catch (error) {
    logger.error('Delete reading list error:', error);
    return { success: false, error: i18n.t('lists.deleteFailed') };
  }
}

export async function addStory(listId: string, storyId: string) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
  try {
    store.dispatch(addStoryToList({ listId, storyId }));
    await updateDoc(doc(listsRef(user.id), listId), {
      storyIds: arrayUnion(storyId),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    logger.error('Add story to list error:', error);
    // İyimser değişikliği gerçekle hizala.
    void loadLists();
    return { success: false, error: i18n.t('lists.addStoryFailed') };
  }
}

export async function removeStory(listId: string, storyId: string) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };
  try {
    store.dispatch(removeStoryFromList({ listId, storyId }));
    await updateDoc(doc(listsRef(user.id), listId), {
      storyIds: arrayRemove(storyId),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    logger.error('Remove story from list error:', error);
    // İyimser değişikliği gerçekle hizala.
    void loadLists();
    return { success: false, error: i18n.t('lists.removeStoryFailed') };
  }
}

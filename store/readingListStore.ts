import { Story } from '@/types';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from './index';
import {
  addStoryToList,
  patchReadingList,
  removeList,
  removeStoryFromList,
  updateList,
  upsertList,
  type ReadingListMeta,
} from './slices/readingListSlice';
import { storyActions } from './storyStore';
import { logger } from '@/utils/logger';

export type { ReadingListMeta, ReadingListState } from './slices/readingListSlice';

const listsRef = (uid: string) => collection(getFirestore(), 'users', uid, 'readingLists');

export const readingListActions = {
  async loadLists() {
    const { user } = store.getState().auth;
    if (!user?.id) {
      store.dispatch(patchReadingList({ lists: [], loaded: true }));
      return;
    }
    try {
      const snap = await getDocs(query(listsRef(user.id), orderBy('createdAt', 'desc')));
      const lists: ReadingListMeta[] = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || i18n.t('lists.list'),
          description: data.description || '',
          isPublic: data.isPublic !== false,
          storyIds: Array.isArray(data.storyIds) ? data.storyIds : [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      store.dispatch(patchReadingList({ lists }));
    } catch (error) {
      logger.error('Load reading lists error:', error);
    } finally {
      store.dispatch(patchReadingList({ loaded: true }));
    }
  },

  async createList(name: string, opts?: { description?: string; isPublic?: boolean }) {
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
  },

  async renameList(listId: string, name: string) {
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
  },

  async deleteList(listId: string) {
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
  },

  isInList(listId: string, storyId: string) {
    const list = store.getState().readingList.lists.find(l => l.id === listId);
    return !!list && list.storyIds.includes(storyId);
  },

  async addStory(listId: string, storyId: string) {
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
      this.loadLists();
      return { success: false, error: i18n.t('lists.addStoryFailed') };
    }
  },

  async removeStory(listId: string, storyId: string) {
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
      this.loadLists();
      return { success: false, error: i18n.t('lists.removeStoryFailed') };
    }
  },

  async getListStories(listId: string): Promise<Story[]> {
    const list = store.getState().readingList.lists.find(l => l.id === listId);
    if (!list || list.storyIds.length === 0) return [];
    const fetched = await Promise.all(list.storyIds.map(sid => storyActions.getStoryById(sid)));
    return fetched.filter((s): s is Story => !!s);
  },
};

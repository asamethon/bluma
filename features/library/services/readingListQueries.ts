import type { Story } from '@/types';
import i18n from '@/i18n';
import {
  getDocs,
  orderBy,
  query,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { patchReadingList, type ReadingListMeta } from '@/store/slices/readingListSlice';
import { storyActions } from '@/store/storyStore';
import { logger } from '@/utils/logger';
import { listsRef } from './readingListRefs';

export async function loadLists() {
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
}

export async function getListStories(listId: string): Promise<Story[]> {
  const list = store.getState().readingList.lists.find(l => l.id === listId);
  if (!list || list.storyIds.length === 0) return [];
  const fetched = await Promise.all(list.storyIds.map(sid => storyActions.getStoryById(sid)));
  return fetched.filter((s): s is Story => !!s);
}

/** Hikâye bu listede zaten var mı (store'dan okunur, ağ gerektirmez). */
export function isInList(listId: string, storyId: string): boolean {
  const list = store.getState().readingList.lists.find(item => item.id === listId);
  return !!list?.storyIds.includes(storyId);
}

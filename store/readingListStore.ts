import { Story } from '@/types';
import { observable } from '@legendapp/state';
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
import { authState$ } from './authStore';
import { storyActions } from './storyStore';

export interface ReadingListMeta {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  storyIds: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ReadingListState {
  lists: ReadingListMeta[];
  loaded: boolean;
}

export const readingListState$ = observable<ReadingListState>({
  lists: [],
  loaded: false,
});

const listsRef = (uid: string) => collection(getFirestore(), 'users', uid, 'readingLists');

export const readingListActions = {
  async loadLists() {
    const { user } = authState$.get();
    if (!user?.id) {
      readingListState$.lists.set([]);
      readingListState$.loaded.set(true);
      return;
    }
    try {
      const snap = await getDocs(query(listsRef(user.id), orderBy('createdAt', 'desc')));
      const lists: ReadingListMeta[] = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || 'Liste',
          description: data.description || '',
          isPublic: data.isPublic !== false,
          storyIds: Array.isArray(data.storyIds) ? data.storyIds : [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      readingListState$.lists.set(lists);
    } catch (error) {
      console.error('Load reading lists error:', error);
    } finally {
      readingListState$.loaded.set(true);
    }
  },

  async createList(name: string, opts?: { description?: string; isPublic?: boolean }) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Liste adı boş olamaz.' };
    try {
      const ref = await addDoc(listsRef(user.id), {
        name: trimmed,
        description: opts?.description?.trim() || '',
        isPublic: opts?.isPublic !== false,
        storyIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      readingListState$.lists.set(prev => [
        { id: ref.id, name: trimmed, description: opts?.description || '', isPublic: opts?.isPublic !== false, storyIds: [] },
        ...prev,
      ]);
      return { success: true, listId: ref.id };
    } catch (error) {
      console.error('Create reading list error:', error);
      return { success: false, error: 'Liste oluşturulamadı.' };
    }
  },

  async renameList(listId: string, name: string) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Liste adı boş olamaz.' };
    try {
      await updateDoc(doc(listsRef(user.id), listId), { name: trimmed, updatedAt: serverTimestamp() });
      readingListState$.lists.set(prev => prev.map(l => l.id === listId ? { ...l, name: trimmed } : l));
      return { success: true };
    } catch (error) {
      console.error('Rename reading list error:', error);
      return { success: false, error: 'Liste güncellenemedi.' };
    }
  },

  async deleteList(listId: string) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    try {
      await deleteDoc(doc(listsRef(user.id), listId));
      readingListState$.lists.set(prev => prev.filter(l => l.id !== listId));
      return { success: true };
    } catch (error) {
      console.error('Delete reading list error:', error);
      return { success: false, error: 'Liste silinemedi.' };
    }
  },

  isInList(listId: string, storyId: string) {
    const list = readingListState$.lists.get().find(l => l.id === listId);
    return !!list && list.storyIds.includes(storyId);
  },

  async addStory(listId: string, storyId: string) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    try {
      // Optimistic
      readingListState$.lists.set(prev => prev.map(l =>
        l.id === listId && !l.storyIds.includes(storyId)
          ? { ...l, storyIds: [...l.storyIds, storyId] }
          : l
      ));
      await updateDoc(doc(listsRef(user.id), listId), {
        storyIds: arrayUnion(storyId),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Add story to list error:', error);
      this.loadLists();
      return { success: false, error: 'Hikâye listeye eklenemedi.' };
    }
  },

  async removeStory(listId: string, storyId: string) {
    const { user } = authState$.get();
    if (!user?.id) return { success: false, error: 'Giriş gerekli.' };
    try {
      readingListState$.lists.set(prev => prev.map(l =>
        l.id === listId
          ? { ...l, storyIds: l.storyIds.filter(s => s !== storyId) }
          : l
      ));
      await updateDoc(doc(listsRef(user.id), listId), {
        storyIds: arrayRemove(storyId),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Remove story from list error:', error);
      this.loadLists();
      return { success: false, error: 'Hikâye listeden çıkarılamadı.' };
    }
  },

  // Bir listenin hikâyelerini (sıralı) yükle
  async getListStories(listId: string): Promise<Story[]> {
    const list = readingListState$.lists.get().find(l => l.id === listId);
    if (!list || list.storyIds.length === 0) return [];
    const fetched = await Promise.all(list.storyIds.map(sid => storyActions.getStoryById(sid)));
    return fetched.filter((s): s is Story => !!s);
  },
};

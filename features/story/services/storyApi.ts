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

// Story CRUD operations
export async function createStory(storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount' | 'author'>) {
  try {
    store.dispatch(patchStory({ isLoading: true }));
    const { user } = store.getState().auth;

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();
    const storiesRef = collection(firestore, 'stories');

    // undefined, null ve boş string değerleri filtrele
    const cleanStoryData = Object.fromEntries(
      Object.entries(storyData).filter(([key, value]) => {
        // undefined, null ve boş string'leri filtrele
        if (value === undefined || value === null || value === '') {
          return false;
        }
        // Boş array'leri filtrele
        if (Array.isArray(value) && value.length === 0) {
          return false;
        }
        return true;
      })
    );

    const newStory = {
      ...cleanStoryData,
      authorId: user.id,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(storiesRef, newStory);

    // Update user's stories count only for published stories
    if (storyData.isPublished) {
      await updateUserStoriesCount(user.id, 1);

      // Takipçilere "yeni hikâye" duyurusu — arka planda, akışı bloklamaz
      notificationActions.announceStoryToFollowers(
        user.id,
        user.displayName || user.username || 'Takip ettiğin bir yazar',
        docRef.id,
        storyData.title,
        'new_story'
      ).catch(() => {});

      logEvent(getAnalytics(), 'story_publish', { story_id: docRef.id }).catch(() => {});
    }

    store.dispatch(patchStory({ isLoading: false }));
    return { success: true, storyId: docRef.id };
  } catch (error) {
    console.error('Create story error:', error);
    store.dispatch(patchStory({ isLoading: false }));
    store.dispatch(patchStory({ error: error instanceof Error ? error.message : 'Story creation failed' }));
    return { success: false, error: error instanceof Error ? error.message : 'Story creation failed' };
  }
}

export async function updateStory(storyId: string, updates: Partial<Story>) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    // Get current story data
    const storyDoc = await getDoc(storyRef);
    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }

    const currentStoryData = storyDoc.data() as Story;

    await updateDoc(storyRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Update user's stories count if publishing a draft
    if (updates.isPublished && !currentStoryData.isPublished) {
      await updateUserStoriesCount(currentStoryData.authorId, 1);
    }

    // Takipçi duyuruları (arka planda): taslak→yayın geçişi "yeni hikâye",
    // yayındaki hikâyeye bölüm eklenmesi "yeni bölüm" bildirimi üretir.
    const { user } = store.getState().auth;
    if (user?.id === currentStoryData.authorId) {
      const authorName = user.displayName || user.username || 'Takip ettiğin bir yazar';
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
    console.error('Update story error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Story update failed' };
  }
}

export async function deleteStory(storyId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    // Yayın durumunu SİLMEDEN ÖNCE oku — eski kod önce siliyor sonra
    // okumaya çalışıyordu, bu yüzden storiesCount hiç azalmıyordu.
    const storyDoc = await getDoc(storyRef);
    if (!storyDoc.exists()) {
      return { success: false, error: 'Story not found' };
    }
    const wasPublished = (storyDoc.data() as Story).isPublished;

    // Alt koleksiyonları hikâye dokümanından ÖNCE temizle — güvenlik
    // kuralları yazar kontrolü için hikâye dokümanına bakar. Tüm silinecek
    // referanslar önce toplanır, sonra 500'lük writeBatch parçalarıyla
    // gönderilir — yarıda kesilme (network kopması vb.) tutarsızlığını azaltır.
    const refsToDelete: any[] = [];

    const likesSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'likes'));
    refsToDelete.push(...likesSnapshot.docs.map((d: any) => d.ref));

    const viewsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'views'));
    refsToDelete.push(...viewsSnapshot.docs.map((d: any) => d.ref));

    // Bölüm-bazlı depolamaya geçmiş hikâyelerin chapters alt koleksiyonu (2.2)
    // + her bölümün beğeni alt koleksiyonu (2.3)
    const chaptersSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'chapters'));
    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapterLikes = await getDocs(collection(firestore, 'stories', storyId, 'chapters', chapterDoc.id, 'likes'));
      refsToDelete.push(...chapterLikes.docs.map((d: any) => d.ref));
      refsToDelete.push(chapterDoc.ref);
    }

    // Yorumlar + her yorumun beğeni alt koleksiyonu
    const commentsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'comments'));
    for (const commentDoc of commentsSnapshot.docs) {
      const commentLikes = await getDocs(collection(firestore, 'stories', storyId, 'comments', commentDoc.id, 'likes'));
      refsToDelete.push(...commentLikes.docs.map((d: any) => d.ref));
      refsToDelete.push(commentDoc.ref);
    }

    // 500'lük parçalar hâlinde atomik sil
    for (let i = 0; i < refsToDelete.length; i += 500) {
      const batch = writeBatch(firestore);
      refsToDelete.slice(i, i + 500).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    // En son hikâyenin kendisini sil
    await deleteDoc(storyRef);

    // Update user's stories count only if it was published
    if (wasPublished) {
      await updateUserStoriesCount(user.id, -1);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete story error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Story deletion failed' };
  }
}

// Fetch operations
export async function getStoryById(storyId: string): Promise<Story | null> {
  try {
    if (!storyId || typeof storyId !== 'string') return null;
    const firestore = getFirestore();
    // Doğrudan doküman okuması — __name__ sorgusundan daha ucuz/hızlı.
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
    // permission-denied artık beklenen bir durum: hikâye taslağa dönmüş ya da
    // silinmiş olabilir (ör. beğenilen/kaydedilen bir hikâye sonradan
    // yayından kaldırılmış) — çağıranlar zaten null'ı filtreliyor, sessiz geç.
    if (error?.code === 'firestore/permission-denied') {
      console.log('Get story skipped (no longer accessible, non-critical):', storyId);
    } else {
      console.error('Get story error:', error);
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

    // Sort stories by createdAt in descending order (newest first)
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
    console.error('Load user stories error:', error);
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

    // Sort stories by createdAt in descending order (newest first)
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
    console.error('Load published user stories error:', error);
    return [];
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}

// Adjusts the author's published-story counter by `delta` (+1 / -1).
// NOTE: the param used to be named `increment`, which shadowed the imported
// Firestore `increment()` helper — so this *set* storiesCount to a literal
// 1 or -1 instead of incrementing it. We use the atomic increment field-value
// so the count only ever reflects published stories.
export async function updateUserStoriesCount(userId: string, delta: number) {
  try {
    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      storiesCount: increment(delta),
    });
  } catch (error) {
    console.error('Update user stories count error:', error);
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

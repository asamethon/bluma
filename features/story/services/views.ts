import { Story } from '@/types';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    getFirestore,
    increment,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';
import { authState$ } from '../../../store/authStore';
import { storyState$ } from '../../../store/storyStore';

// Hikaye görüntülenme sayısını artır (kullanıcı bazlı limit ile)
export async function incrementStoryViews(storyId: string) {
  try {
    const { user } = authState$.get();
    if (!user?.id) return;

    const firestore = getFirestore();

    // Kullanıcının bu hikayeyi kaç kez görüntülediğini kontrol et
    const userViewsQuery = query(
      collection(firestore, 'stories', storyId, 'views'),
      where('userId', '==', user.id)
    );

    const userViewsSnapshot = await getDocs(userViewsQuery);
    const currentViewCount = userViewsSnapshot.size;

    // Maksimum 3 görüntülenme limiti
    if (currentViewCount >= 3) {
      console.log('User has reached max view count for this story');
      return;
    }

    // Yeni görüntülenme kaydı ekle
    await addDoc(collection(firestore, 'stories', storyId, 'views'), {
      userId: user.id,
      viewedAt: serverTimestamp(),
    });

    // Toplam sayacı atomik artır — eski kod her görüntülemede TÜM views
    // koleksiyonunu okuyordu (popüler hikâyede görüntüleme başına yüzlerce
    // okuma = maliyet bombası).
    await updateDoc(doc(firestore, 'stories', storyId), {
      viewsCount: increment(1),
    });

    // UI state'lerini yerelde +1 güncelle
    const bump = (stories: Story[]) =>
      stories.map(s => s.id === storyId ? { ...s, viewsCount: (s.viewsCount || 0) + 1 } : s);
    storyState$.stories.set(bump);
    storyState$.discoverStories.set(bump);
    storyState$.followingStories.set(bump);
    const cur = storyState$.currentStory.get();
    if (cur && cur.id === storyId) {
      storyState$.currentStory.set({ ...cur, viewsCount: (cur.viewsCount || 0) + 1 });
    }

  } catch (error) {
    console.error('Increment story views error:', error);
  }
}

// Hikayenin benzersiz okuyucu sayısını getir
export async function getUniqueReadersCount(storyId: string): Promise<number> {
  try {
    const firestore = getFirestore();
    const viewsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'views'));

    // Benzersiz kullanıcı ID'lerini al
    const uniqueUserIds = new Set();
    viewsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.userId) {
        uniqueUserIds.add(data.userId);
      }
    });

    return uniqueUserIds.size;
  } catch (error) {
    console.error('Get unique readers count error:', error);
    return 0;
  }
}

export const viewsActions = {
  incrementStoryViews,
  getUniqueReadersCount,
};

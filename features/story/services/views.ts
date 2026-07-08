import { Story } from '@/types';
import {
    doc,
    getDoc,
    getDocs,
    collection,
    getFirestore,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';

// Aynı hikâye için eşzamanlı çağrıları (ör. React StrictMode'un effect'i iki
// kez çalıştırması) atlar — art arda gelen çağrılar sunucudaki sayacı aynı
// anda okuyup üçünün de limit altında sanıp yazmaya çalışması, biri
// tamamlandıktan sonra diğerinin ±1 kuralına takılıp permission-denied
// atmasına yol açıyordu.
const inFlightViewIncrements = new Set<string>();

// Hikaye görüntülenme sayısını artır (kullanıcı bazlı limit ile)
// Deterministik doküman ID'si (views/{userId}) — sorgu yerine tek doküman
// okuması; koleksiyon taraması eski maliyet bombasıydı (bkz. YAPILACAKLAR 0.5).
export async function incrementStoryViews(storyId: string) {
  const { user } = store.getState().auth;
  if (!user?.id) return;
  const dedupeKey = `${storyId}_${user.id}`;
  if (inFlightViewIncrements.has(dedupeKey)) return;
  inFlightViewIncrements.add(dedupeKey);

  try {
    const firestore = getFirestore();
    const viewRef = doc(firestore, 'stories', storyId, 'views', user.id);

    const viewDoc = await getDoc(viewRef);
    const currentViewCount = viewDoc.exists() ? (viewDoc.data()?.count || 0) : 0;

    // Maksimum 3 görüntülenme limiti
    if (currentViewCount >= 3) {
      console.log('User has reached max view count for this story');
      return;
    }

    await setDoc(viewRef, {
      count: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Toplam sayacı atomik artır — eski kod her görüntülemede TÜM views
    // koleksiyonunu okuyordu (popüler hikâyede görüntüleme başına yüzlerce
    // okuma = maliyet bombası).
    await updateDoc(doc(firestore, 'stories', storyId), {
      viewsCount: increment(1),
    });

    // UI state'lerini yerelde +1 güncelle
    const bump = (list: Story[]) =>
      list.map(s => s.id === storyId ? { ...s, viewsCount: (s.viewsCount || 0) + 1 } : s);
    const { stories, discoverStories, followingStories } = store.getState().story;
    store.dispatch(patchStory({
      stories: bump(stories),
      discoverStories: bump(discoverStories),
      followingStories: bump(followingStories),
    }));
    const cur = store.getState().story.currentStory;
    if (cur && cur.id === storyId) {
      store.dispatch(patchStory({ currentStory: { ...cur, viewsCount: (cur.viewsCount || 0) + 1 } }));
    }

  } catch (error: any) {
    // permission-denied burada beklenen bir yarış durumu (eşzamanlı çağrılar
    // arasında biri limiti aşmış olabilir) — sessiz kalsın, gerçek hataları
    // (ağ, vb.) yine de logla.
    if (error?.code === 'firestore/permission-denied') {
      console.log('Increment story views skipped (rate/race, non-critical):', error.message);
    } else {
      console.error('Increment story views error:', error);
    }
  } finally {
    inFlightViewIncrements.delete(dedupeKey);
  }
}

// Hikayenin benzersiz okuyucu sayısını getir
// Doküman ID'si == kullanıcı ID'si olduğundan, doküman sayısı zaten benzersiz
// okuyucu sayısıdır — ayrıca Set ile tekilleştirmeye gerek yok.
export async function getUniqueReadersCount(storyId: string): Promise<number> {
  try {
    const firestore = getFirestore();
    const viewsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'views'));
    return viewsSnapshot.size;
  } catch (error) {
    console.error('Get unique readers count error:', error);
    return 0;
  }
}

export const viewsActions = {
  incrementStoryViews,
  getUniqueReadersCount,
};

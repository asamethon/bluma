import { Story } from '@/types';
import {
    collection,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    where,
} from '@react-native-firebase/firestore';
import { getUserById } from './userCache';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';

// Keşfet algoritması - Popüler hikayeleri getir
export async function loadDiscoverStories() {
  try {
    store.dispatch(patchStory({ isLoading: true }));
    const firestore = getFirestore();

    // NOT: burada zaman filtresi YOK (bkz. YAPILACAKLAR 2.5) — tüm zamanların
    // popülerlik skoruna göre sıralanır; "yeni hikâyeler" avantajı zaten
    // calculatePopularityScore'daki timeWeight ile sağlanıyor.
    const storiesQuery = query(
      collection(firestore, 'stories'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100) // Daha fazla veri al, sonra filtrele
    );

    const snapshot = await getDocs(storiesQuery);

    // Yazar okumaları paralel — sıralı await 100 hikâyede çok sayıda round-trip
    // biriktirip Keşfet/ana sayfayı gereksiz yere geciktiriyordu.
    const storiesWithScores: (Story & { popularityScore: number })[] = await Promise.all(
      snapshot.docs.map(async (storyDoc) => {
        const storyData = storyDoc.data() as Story;
        const author = await getUserById(storyData.authorId);

        const story = {
          ...storyData,
          id: storyDoc.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        };

        return { ...story, popularityScore: calculatePopularityScore(story) };
      })
    );

    // Popülerlik skoruna göre sırala
    storiesWithScores.sort((a, b) => b.popularityScore - a.popularityScore);

    // İlk 50 hikayeyi al
    const topStories = storiesWithScores.slice(0, 50).map(({ popularityScore, ...story }) => story);

    store.dispatch(patchStory({ discoverStories: topStories }));
  } catch (error) {
    console.error('Load discover stories error:', error);
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}

// Popülerlik skoru hesaplama algoritması
export function calculatePopularityScore(story: Story): number {
  const now = new Date();
  const storyDate = story.createdAt && typeof story.createdAt === 'object' && 'toDate' in story.createdAt
    ? (story.createdAt as any).toDate()
    : new Date(story.createdAt || 0);

  // Gün cinsinden yaş
  const ageInDays = Math.max(1, (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60 * 24));

  // Etkileşim skorları
  const likesScore = (story.likesCount || 0) * 3; // Beğeniler daha değerli
  const commentsScore = (story.commentsCount || 0) * 5; // Yorumlar çok değerli
  const viewsScore = (story.viewsCount || 0) * 0.1; // Görüntülemeler az değerli

  // Zaman ağırlığı (yeni hikayeler avantajlı)
  const timeWeight = Math.max(0.1, 1 / Math.sqrt(ageInDays));

  // Premium ve tamamlanmış hikaye bonusu
  const premiumBonus = story.isPremium ? 1.2 : 1.0;
  const completedBonus = story.isCompleted ? 1.1 : 1.0;

  // Final skor
  const totalScore = (likesScore + commentsScore + viewsScore) * timeWeight * premiumBonus * completedBonus;

  return totalScore;
}

// Takip edilen kullanıcıların hikayelerini getir
export async function loadFollowingStories() {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      store.dispatch(patchStory({ followingStories: [] }));
      return;
    }

    store.dispatch(patchStory({ isLoading: true }));
    const firestore = getFirestore();

    // Takip edilen kullanıcıları getir
    const followingQuery = query(
      collection(firestore, 'users', user.id, 'following'),
      orderBy('createdAt', 'desc')
    );

    const followingSnapshot = await getDocs(followingQuery);
    // Doküman ID'si takip edilen kullanıcının ID'sidir (followUser doc(userId).set
    // ile yazar). Eski kayıtlar alan adı olarak userId kullanır; doc.id her iki
    // formatta da doğrudur.
    const followingUserIds = followingSnapshot.docs
      .map((doc: any) => doc.id || doc.data().userId)
      .filter(Boolean);

    if (followingUserIds.length === 0) {
      store.dispatch(patchStory({ followingStories: [] }));
      return;
    }

    // Chunk'lara böl (Firestore 'in' operatörü max 10 değer alır) — hem
    // chunk sorguları hem yazar okumaları paralel, sıralı await yığını
    // takip akışını da aynı şekilde geciktiriyordu.
    const chunks = chunkArray(followingUserIds, 10);
    const chunkResults = await Promise.all(
      chunks.map(async (chunk) => {
        const storiesQuery = query(
          collection(firestore, 'stories'),
          where('authorId', 'in', chunk),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const snapshot = await getDocs(storiesQuery);

        return Promise.all(
          snapshot.docs.map(async (storyDoc) => {
            const storyData = storyDoc.data() as Story;
            const author = await getUserById(storyData.authorId);
            return {
              ...storyData,
              id: storyDoc.id,
              author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
            };
          })
        );
      })
    );
    const allStories: Story[] = chunkResults.flat();

    // Tarihe göre sırala (en yeni önce)
    allStories.sort((a, b) => {
      const dateA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
        ? (a.createdAt as any).toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
        ? (b.createdAt as any).toDate()
        : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    store.dispatch(patchStory({ followingStories: allStories.slice(0, 50) }));
  } catch (error) {
    console.error('Load following stories error:', error);
    store.dispatch(patchStory({ followingStories: [] }));
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}

// Yardımcı fonksiyon: Array'i chunk'lara böl
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Keşfet hikayelerini yenile
export async function refreshDiscoverStories() {
  await loadDiscoverStories();
}

// Takip edilen hikayeleri yenile
export async function refreshFollowingStories() {
  await loadFollowingStories();
}

export const discoverActions = {
  loadDiscoverStories,
  calculatePopularityScore,
  loadFollowingStories,
  chunkArray,
  refreshDiscoverStories,
  refreshFollowingStories,
};

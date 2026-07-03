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
import { authState$ } from '@/store/authState';
import { storyState$ } from '@/store/storyState';
import { getUserById } from './userCache';

// Keşfet algoritması - Popüler hikayeleri getir
export async function loadDiscoverStories() {
  try {
    storyState$.isLoading.set(true);
    const firestore = getFirestore();

    // Son 30 gün içindeki yayınlanan hikayeleri getir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const storiesQuery = query(
      collection(firestore, 'stories'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100) // Daha fazla veri al, sonra filtrele
    );

    const snapshot = await getDocs(storiesQuery);
    const storiesWithScores: (Story & { popularityScore: number })[] = [];

    for (const storyDoc of snapshot.docs) {
      const storyData = storyDoc.data() as Story;
      const author = await getUserById(storyData.authorId);

      const story = {
        ...storyData,
        id: storyDoc.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      };

      // Popülerlik skoru hesapla
      const popularityScore = calculatePopularityScore(story);

      storiesWithScores.push({
        ...story,
        popularityScore,
      });
    }

    // Popülerlik skoruna göre sırala
    storiesWithScores.sort((a, b) => b.popularityScore - a.popularityScore);

    // İlk 50 hikayeyi al
    const topStories = storiesWithScores.slice(0, 50).map(({ popularityScore, ...story }) => story);

    storyState$.discoverStories.set(topStories);
  } catch (error) {
    console.error('Load discover stories error:', error);
  } finally {
    storyState$.isLoading.set(false);
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
    const { user } = authState$.get();
    if (!user?.id) {
      storyState$.followingStories.set([]);
      return;
    }

    storyState$.isLoading.set(true);
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
      storyState$.followingStories.set([]);
      return;
    }

    // Chunk'lara böl (Firestore 'in' operatörü max 10 değer alır)
    const chunks = chunkArray(followingUserIds, 10);
    const allStories: Story[] = [];

    for (const chunk of chunks) {
      const storiesQuery = query(
        collection(firestore, 'stories'),
        where('authorId', 'in', chunk),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(storiesQuery);

      for (const storyDoc of snapshot.docs) {
        const storyData = storyDoc.data() as Story;
        const author = await getUserById(storyData.authorId);

        allStories.push({
          ...storyData,
          id: storyDoc.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        });
      }
    }

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

    storyState$.followingStories.set(allStories.slice(0, 50));
  } catch (error) {
    console.error('Load following stories error:', error);
    storyState$.followingStories.set([]);
  } finally {
    storyState$.isLoading.set(false);
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

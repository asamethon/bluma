import { pushNotificationService } from '@/services/pushNotificationService';
import { Story } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    increment,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';
import { authState$ } from '../../../store/authStore';
import { notificationActions } from '../../../store/notificationStore';
import { storyState$ } from '../../../store/storyStore';
import { getStoryById } from './storyApi';

// Like/Unlike story
// Optimistic: UI'yi anında günceller, Firebase işini arka planda yürütür.
// Sayaç, tüm `likes` koleksiyonunu okumak yerine atomik increment() ile
// güncellenir (her dokunuşta O(n) okuma yapmaz).
export async function likeStory(storyId: string) {
  try {
    const { user } = authState$.get();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const wasLiked = storyState$.likedStories.get().some(s => s.id === storyId);

    // Hedef hikâyeyi state'lerden bul (likedStories'a eklemek için)
    const findStory = (): Story | undefined =>
      storyState$.stories.get().find(s => s.id === storyId) ||
      storyState$.discoverStories.get().find(s => s.id === storyId) ||
      storyState$.followingStories.get().find(s => s.id === storyId) ||
      (storyState$.currentStory.get()?.id === storyId ? storyState$.currentStory.get()! : undefined);

    // 1) Optimistic likesCount güncellemesi (tüm feed state'leri + currentStory)
    applyLikeDelta(storyId, wasLiked ? -1 : 1);

    // 2) Optimistic likedStories listesi
    if (wasLiked) {
      storyState$.likedStories.set(prev => prev.filter(s => s.id !== storyId));
    } else {
      const story = findStory();
      if (story) {
        storyState$.likedStories.set(prev =>
          prev.some(s => s.id === storyId)
            ? prev
            : [{ ...story, likesCount: (story.likesCount || 0) + 1 }, ...prev]
        );
      }
    }

    // 3) Firebase işini arka planda yür
    performLikeStoryFirebaseOperation(storyId, user.id);

    return { success: true };
  } catch (error) {
    console.error('Like story error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Like operation failed' };
  }
}

// Bir hikâyenin likesCount'unu tüm feed state'lerinde + currentStory'de değiştir.
export function applyLikeDelta(storyId: string, delta: number) {
  const upd = (arr: Story[]) =>
    arr.map(s => s.id === storyId ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) + delta) } : s);
  storyState$.stories.set(upd);
  storyState$.discoverStories.set(upd);
  storyState$.followingStories.set(upd);
  const cur = storyState$.currentStory.get();
  if (cur && cur.id === storyId) {
    storyState$.currentStory.set({ ...cur, likesCount: Math.max(0, (cur.likesCount || 0) + delta) });
  }
}

// Firebase like işlemlerini arka planda yap (server durumunu otorite kabul eder)
export async function performLikeStoryFirebaseOperation(storyId: string, userId: string) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    // Server'da gerçekten beğenilmiş mi? (1 küçük okuma)
    const likeDoc = await getDocs(query(collection(firestore, 'stories', storyId, 'likes'), where('userId', '==', userId)));

    if (!likeDoc.empty) {
      // Unlike
      await deleteDoc(likeDoc.docs[0].ref);

      const userLikedStoriesQuery = query(
        collection(firestore, 'users', userId, 'likedStories'),
        where('storyId', '==', storyId)
      );
      const userLikedStoriesDoc = await getDocs(userLikedStoriesQuery);
      if (!userLikedStoriesDoc.empty) {
        await deleteDoc(userLikedStoriesDoc.docs[0].ref);
      }

      await updateDoc(storyRef, { likesCount: increment(-1) });
    } else {
      // Like
      await addDoc(collection(firestore, 'stories', storyId, 'likes'), {
        userId,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(firestore, 'users', userId, 'likedStories'), {
        storyId,
        createdAt: serverTimestamp(),
      });
      await updateDoc(storyRef, { likesCount: increment(1) });

      // Bildirim gönderme işlemini arka planda yap
      sendLikeNotification(storyId, userId);
    }
  } catch (error) {
    console.error('Firebase like operation error:', error);
    // Hata durumunda server gerçeğinden yeniden eşitle
    refreshLikedStoriesState();
    updateStoryLikesCount(storyId);
  }
}

// Bildirim gönderme işlemini arka planda yap
export async function sendLikeNotification(storyId: string, userId: string) {
  try {
    const { user } = authState$.get();
    if (!user) return;

    const storyData = await getStoryById(storyId);
    if (storyData && storyData.authorId !== userId) {
      // Bildirim işlemlerini paralel yap
      Promise.all([
        notificationActions.createLikeNotification(
          userId,
          storyData.authorId,
          user.displayName || user.username || 'Bir kullanıcı',
          storyData.title,
          storyId,
          false // isConversation flag
        ),
        // Push notification gönder
        pushNotificationService.sendNotificationToUser(
          storyData.authorId,
          'Hikayen Beğenildi!',
          `${user.displayName || user.username || 'Bir kullanıcı'} hikayeni beğendi.`,
          { type: 'story', storyId }
        )
      ]).catch(error => {
        console.error('Story like notification error:', error);
        // Push notification hatası ana işlemi engellemesin
      });
    }
  } catch (error) {
    console.error('Send like notification error:', error);
  }
}

// UI'yi geri al (hata durumunda)
export function revertLikeStoryUI(storyId: string) {
  const currentStories = storyState$.stories.get();
  const storyIndex = currentStories.findIndex(s => s.id === storyId);

  if (storyIndex !== -1) {
    const story = currentStories[storyIndex];
    const isCurrentlyLiked = storyState$.likedStories.get().some(s => s.id === storyId);

    if (isCurrentlyLiked) {
      // Geri al: unlike yapılmışsa like'a çevir
      storyState$.stories.set(prev =>
        prev.map(s => s.id === storyId
          ? { ...s, likesCount: (s.likesCount || 0) + 1 }
          : s
        )
      );
      storyState$.likedStories.set(prev => [...prev, story]);
    } else {
      // Geri al: like yapılmışsa unlike'a çevir
      storyState$.stories.set(prev =>
        prev.map(s => s.id === storyId
          ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) - 1) }
          : s
        )
      );
      storyState$.likedStories.set(prev => prev.filter(s => s.id !== storyId));
    }
  }
}

export async function isStoryLiked(storyId: string): Promise<boolean> {
  try {
    const { user } = authState$.get();
    if (!user?.id) return false;

    // Real-time likedStories state'inden kontrol et
    const likedStories = storyState$.likedStories.get();
    return likedStories.some(story => story.id === storyId);
  } catch (error) {
    console.error('Check story like error:', error);
    return false;
  }
}

// Story likes count'ını Firebase'den güncelle
export async function updateStoryLikesCount(storyId: string) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    // Gerçek beğeni sayısını al
    const allLikes = await getDocs(collection(firestore, 'stories', storyId, 'likes'));
    const realLikesCount = allLikes.size;

    // Story'yi güncelle
    await updateDoc(storyRef, { likesCount: realLikesCount });

    // UI'yi güncelle
    storyState$.stories.set(prev =>
      prev.map(s => s.id === storyId
        ? { ...s, likesCount: realLikesCount }
        : s
      )
    );
  } catch (error) {
    console.error('Update story likes count error:', error);
  }
}

// LikedStories state'ini Firebase'den yenile
export async function refreshLikedStoriesState() {
  try {
    const { user } = authState$.get();
    if (!user?.id) return;

    const firestore = getFirestore();
    const likesQuery = query(
      collection(firestore, 'users', user.id, 'likedStories'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(likesQuery);
    const fetched = await Promise.all(
      snapshot.docs.map(likeDoc => getStoryById(likeDoc.data().storyId))
    );
    storyState$.likedStories.set(fetched.filter((s): s is Story => !!s));
  } catch (error) {
    console.error('Refresh liked stories state error:', error);
  }
}

export async function loadLikedStories() {
  try {
    const { user } = authState$.get();
    if (!user?.id) return;

    const firestore = getFirestore();
    const likesQuery = query(
      collection(firestore, 'users', user.id, 'likedStories'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(likesQuery);
    const fetched = await Promise.all(
      snapshot.docs.map(likeDoc => getStoryById(likeDoc.data().storyId))
    );
    storyState$.likedStories.set(fetched.filter((s): s is Story => !!s));
  } catch (error) {
    console.error('Load liked stories error:', error);
  }
}

export const likesActions = {
  likeStory,
  applyLikeDelta,
  performLikeStoryFirebaseOperation,
  sendLikeNotification,
  revertLikeStoryUI,
  isStoryLiked,
  updateStoryLikesCount,
  refreshLikedStoriesState,
  loadLikedStories,
};

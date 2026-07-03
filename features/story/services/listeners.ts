import { Comment, Story } from '@/types';
import {
    collection,
    doc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from '@react-native-firebase/firestore';
import { authState$ } from '@/store/authState';
import { moderationActions } from '../../../store/moderationStore';
import { storyState$ } from '@/store/storyState';
import { loadDiscoverStories, loadFollowingStories } from './discover';
import { loadOfflineStories } from './offline';
import { getStoryById } from './storyApi';
import { getUserById } from './userCache';

// Real-time listener'lar için unsubscribe fonksiyonları
let storiesUnsubscribe: (() => void) | null = null;
let likedStoriesUnsubscribe: (() => void) | null = null;
let savedStoriesUnsubscribe: (() => void) | null = null;
let commentsUnsubscribe: (() => void) | null = null;
let publishedUserStoriesUnsubscribe: (() => void) | null = null;

// Real-time listeners'ları başlat
export function initializeRealTimeListeners() {
  setupStoriesListener();
  setupLikedStoriesListener();
  setupSavedStoriesListener();
  loadDiscoverStories();
  loadFollowingStories();
  loadOfflineStories();
}

// Real-time listeners'ları temizle
export function cleanupRealTimeListeners() {
  if (storiesUnsubscribe) {
    storiesUnsubscribe();
    storiesUnsubscribe = null;
  }
  if (likedStoriesUnsubscribe) {
    likedStoriesUnsubscribe();
    likedStoriesUnsubscribe = null;
  }
  if (savedStoriesUnsubscribe) {
    savedStoriesUnsubscribe();
    savedStoriesUnsubscribe = null;
  }
  if (commentsUnsubscribe) {
    commentsUnsubscribe();
    commentsUnsubscribe = null;
  }
  if (publishedUserStoriesUnsubscribe) {
    publishedUserStoriesUnsubscribe();
    publishedUserStoriesUnsubscribe = null;
  }
}

// Published user stories real-time listener
export function setupPublishedUserStoriesListener(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      console.log('Invalid userId for published user stories listener');
      return;
    }

    // Farklı bir kullanıcı için yeniden kurulabilir; öncekini kapat ki
    // listener birikmesin.
    if (publishedUserStoriesUnsubscribe) {
      publishedUserStoriesUnsubscribe();
      publishedUserStoriesUnsubscribe = null;
    }

    const firestore = getFirestore();
    // Server-side filtering kullan (index hazır olduğunda)
    const userStoriesQuery = query(
      collection(firestore, 'stories'),
      where('authorId', '==', userId),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );

    publishedUserStoriesUnsubscribe = onSnapshot(userStoriesQuery, async (snapshot) => {
      const publishedStoriesList: Story[] = [];

      for (const storyDoc of snapshot.docs) {
        const storyData = storyDoc.data() as Story;
        const author = await getUserById(storyData.authorId);

        publishedStoriesList.push({
          ...storyData,
          id: storyDoc.id,
          author: author || {
            id: storyData.authorId,
            email: '',
            displayName: 'Anonim',
            username: 'user',
            authProvider: 'email' as const,
          },
        });
      }

      storyState$.publishedUserStories.set(publishedStoriesList);
      console.log('Published user stories updated:', publishedStoriesList.length);
    }, (error) => {
      console.error('Published user stories listener error:', error);
      // Index henüz hazır değilse client-side filtering kullan
      if (error.message.includes('failed-precondition')) {
        console.log('Index not ready, using client-side filtering');
        setupPublishedUserStoriesListenerWithClientFiltering(userId);
      }
    });

  } catch (error) {
    console.error('Error setting up published user stories listener:', error);
  }
}

// Client-side filtering fallback
export function setupPublishedUserStoriesListenerWithClientFiltering(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      console.log('Invalid userId for published user stories listener');
      return;
    }

    const firestore = getFirestore();
    // Sadece authorId ile filtrele, client-side'da isPublished kontrolü yap
    const userStoriesQuery = query(
      collection(firestore, 'stories'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    publishedUserStoriesUnsubscribe = onSnapshot(userStoriesQuery, async (snapshot) => {
      const publishedStoriesList: Story[] = [];

      for (const storyDoc of snapshot.docs) {
        const storyData = storyDoc.data() as Story;

        // Client-side filtering: sadece yayınlanan hikayeleri al
        if (storyData.isPublished) {
          const author = await getUserById(storyData.authorId);

          publishedStoriesList.push({
            ...storyData,
            id: storyDoc.id,
            author: author || {
              id: storyData.authorId,
              email: '',
              displayName: 'Anonim',
              username: 'user',
              authProvider: 'email' as const,
            },
          });
        }
      }

      storyState$.publishedUserStories.set(publishedStoriesList);
      console.log('Published user stories updated (client-side filtering):', publishedStoriesList.length);
    }, (error) => {
      console.error('Published user stories listener error (client-side):', error);
    });

  } catch (error) {
    console.error('Error setting up published user stories listener (client-side):', error);
  }
}

// Stories real-time listener
export function setupStoriesListener() {
  // Idempotent: a single shared listener feeds storyState$.stories. Calling
  // this again (e.g. from a screen mount) while one is active is a no-op, so
  // the splash prefetch and screen listeners never duplicate.
  if (storiesUnsubscribe) return;
  try {
    const firestore = getFirestore();
    const storiesQuery = query(
      collection(firestore, 'stories'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    storiesUnsubscribe = onSnapshot(storiesQuery, async (snapshot) => {
      const storiesList: Story[] = [];

      for (const storyDoc of snapshot.docs) {
        const storyData = storyDoc.data() as Story;
        const author = await getUserById(storyData.authorId);

        storiesList.push({
          ...storyData,
          id: storyDoc.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        });
      }

      storyState$.stories.set(storiesList);
      storyState$.storiesLoaded.set(true);
    }, (error) => {
      console.error('Stories listener error:', error);
      // Don't hold the splash forever if the feed errors out.
      storyState$.storiesLoaded.set(true);
    });
  } catch (error) {
    console.error('Setup stories listener error:', error);
  }
}

// Liked stories real-time listener
export function setupLikedStoriesListener() {
  // Idempotent: aktif bir dinleyici varken tekrar çağrılmak no-op olmalı —
  // aksi hâlde her ekran odaklanışında üstüne yeni listener kuruluyordu.
  if (likedStoriesUnsubscribe) return;
  try {
    const { user } = authState$.get();
    if (!user?.id) return;

    const firestore = getFirestore();
    const likesQuery = query(
      collection(firestore, 'users', user.id, 'likedStories'),
      orderBy('createdAt', 'desc')
    );

    likedStoriesUnsubscribe = onSnapshot(likesQuery, async (snapshot) => {
      // Paralel fetch — getStoryById zaten author'ı (cache'li) ekler,
      // ayrı bir getUserById çağrısına gerek yok.
      const fetched = await Promise.all(
        snapshot.docs.map(likeDoc => getStoryById(likeDoc.data().storyId))
      );
      storyState$.likedStories.set(fetched.filter((s): s is Story => !!s));
    }, (error: any) => {
      console.error('Liked stories listener error:', error);

      // If Firestore permission denied, don't crash the app
      if (error.code === 'firestore/permission-denied') {
        console.log('Liked stories listener: Firestore permission denied, continuing without real-time updates');
      }
    });
  } catch (error) {
    console.error('Setup liked stories listener error:', error);
  }
}

// Saved stories real-time listener
export function setupSavedStoriesListener() {
  // Idempotent (bkz. setupLikedStoriesListener)
  if (savedStoriesUnsubscribe) return;
  try {
    const { user } = authState$.get();
    if (!user?.id) return;

    const firestore = getFirestore();
    const savesQuery = query(
      collection(firestore, 'users', user.id, 'savedStories'),
      orderBy('createdAt', 'desc')
    );

    savedStoriesUnsubscribe = onSnapshot(savesQuery, async (snapshot) => {
      const fetched = await Promise.all(
        snapshot.docs.map(saveDoc => getStoryById(saveDoc.data().storyId))
      );
      storyState$.savedStories.set(fetched.filter((s): s is Story => !!s));
    }, (error: any) => {
      console.error('Saved stories listener error:', error);

      // If Firestore permission denied, don't crash the app
      if (error.code === 'firestore/permission-denied') {
        console.log('Saved stories listener: Firestore permission denied, continuing without real-time updates');
      }
    });
  } catch (error) {
    console.error('Setup saved stories listener error:', error);
  }
}

// Comments real-time listener
export function setupCommentsListener(storyId: string) {
  try {
    // Hikâye değişince öncekini kapat — listener birikmesini önler.
    if (commentsUnsubscribe) {
      commentsUnsubscribe();
      commentsUnsubscribe = null;
    }
    const firestore = getFirestore();
    const commentsQuery = query(
      collection(firestore, 'stories', storyId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    commentsUnsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const allComments: Comment[] = [];
      const commentsMap = new Map<string, Comment>();

      // Önce tüm yorumları yükle
      for (const commentDoc of snapshot.docs) {
        const commentData = commentDoc.data() as Comment;

        // Check if userId exists before calling getUserById
        if (commentData.userId) {
          const user = await getUserById(commentData.userId);

          const comment: Comment = {
            ...commentData,
            id: commentDoc.id,
            user: user || { id: '', email: '', displayName: '', authProvider: 'email' },
            replies: [],
          };

          allComments.push(comment);
          commentsMap.set(comment.id, comment);
        } else {
          console.warn('Comment without userId found:', commentDoc.id);
          const comment: Comment = {
            ...commentData,
            id: commentDoc.id,
            user: { id: '', email: '', displayName: '', authProvider: 'email' },
            replies: [],
          };

          allComments.push(comment);
          commentsMap.set(comment.id, comment);
        }
      }

      // Yanıtları parent yorumlara ekle
      const topLevelComments: Comment[] = [];

      for (const comment of allComments) {
        if (comment.parentId) {
          // Bu bir yanıt, parent yoruma ekle
          const parentComment = commentsMap.get(comment.parentId);
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.push(comment);
          }
        } else {
          // Bu bir üst seviye yorum
          topLevelComments.push(comment);
        }
      }

      // Yanıtları tarihe göre sırala (en son gönderilen altta)
      for (const comment of topLevelComments) {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => {
            const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt);
            const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime(); // Eskiden yeniye (en son altta)
          });
        }
      }

      // Engellenen kullanıcıların yorum ve yanıtlarını gizle
      const visibleComments = moderationActions
        .filterBlocked(topLevelComments)
        .map(c => ({ ...c, replies: c.replies ? moderationActions.filterBlocked(c.replies) : c.replies }));
      storyState$.storyComments.set(visibleComments);
    }, (error) => {
      console.error('Comments listener error:', error);
    });
  } catch (error) {
    console.error('Setup comments listener error:', error);
  }
}

// Story detail real-time listener
export function setupStoryDetailListener(storyId: string) {
  try {
    const firestore = getFirestore();
    const storyRef = doc(firestore, 'stories', storyId);

    const unsubscribe = onSnapshot(storyRef, async (snapshot) => {
      if (snapshot.exists()) {
        const storyData = snapshot.data() as Story;
        const author = await getUserById(storyData.authorId);

        const story: Story = {
          ...storyData,
          id: snapshot.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        };

        storyState$.currentStory.set(story);
      }
    }, (error) => {
      console.error('Story detail listener error:', error);
    });

    // Store unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error('Setup story detail listener error:', error);
  }
}

export const listenersActions = {
  initializeRealTimeListeners,
  cleanupRealTimeListeners,
  setupPublishedUserStoriesListener,
  setupPublishedUserStoriesListenerWithClientFiltering,
  setupStoriesListener,
  setupLikedStoriesListener,
  setupSavedStoriesListener,
  setupCommentsListener,
  setupStoryDetailListener,
};

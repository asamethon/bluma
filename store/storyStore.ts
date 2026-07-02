import { offlineStorageService } from '@/services/offlineStorageService';
import { pushNotificationService } from '@/services/pushNotificationService';
import analytics from '@react-native-firebase/analytics';
import { Book, Chapter, Comment, Story, User } from '@/types';
import NetInfo from '@react-native-community/netinfo';

import { observable } from '@legendapp/state';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from '@react-native-firebase/firestore';
import { authState$ } from './authStore';
import { moderationActions } from './moderationStore';
import { notificationActions } from './notificationStore';

// In-memory user cache to avoid refetching the same author repeatedly.
// Feeds often render many stories by the same author (and the same authors
// recur across screens); without this each row triggered its own Firestore
// read. TTL keeps profile data reasonably fresh.
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const userCache = new Map<string, { user: User | null; ts: number }>();
export const invalidateUserCache = (userId?: string) => {
  if (userId) userCache.delete(userId);
  else userCache.clear();
};

export interface StoryState {
  stories: Story[];
  discoverStories: Story[];
  followingStories: Story[];
  userStories: Story[];
  publishedUserStories: Story[];
  savedStories: Story[];
  likedStories: Story[];
  offlineStories: Story[];
  currentStory: Story | null;
  storyComments: Comment[];
  isLoading: boolean;
  /** True once the public stories feed has produced its first result (used to
   *  hold the splash screen so screens don't flash an empty state). */
  storiesLoaded: boolean;
  isDownloading: { [storyId: string]: number }; // progress 0-100
  error: string | null;
}

export const storyState$ = observable<StoryState>({
  stories: [],
  discoverStories: [],
  followingStories: [],
  userStories: [],
  publishedUserStories: [],
  savedStories: [],
  likedStories: [],
  offlineStories: [],
  currentStory: null,
  storyComments: [],
  isLoading: false,
  storiesLoaded: false,
  isDownloading: {},
  error: null,
});

  // Real-time listener'lar için unsubscribe fonksiyonları
  let storiesUnsubscribe: (() => void) | null = null;
  let likedStoriesUnsubscribe: (() => void) | null = null;
  let savedStoriesUnsubscribe: (() => void) | null = null;
  let commentsUnsubscribe: (() => void) | null = null;
  let publishedUserStoriesUnsubscribe: (() => void) | null = null;

export const storyActions = {
  // Real-time listeners'ları başlat
  initializeRealTimeListeners() {
    this.setupStoriesListener();
    this.setupLikedStoriesListener();
    this.setupSavedStoriesListener();
    this.loadDiscoverStories();
    this.loadFollowingStories();
    this.loadOfflineStories();
  },

  // Real-time listeners'ları temizle
  cleanupRealTimeListeners() {
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
  },

  // Published user stories real-time listener
  setupPublishedUserStoriesListener(userId: string) {
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
          const author = await this.getUserById(storyData.authorId);
          
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
          this.setupPublishedUserStoriesListenerWithClientFiltering(userId);
        }
      });

    } catch (error) {
      console.error('Error setting up published user stories listener:', error);
    }
  },

  // Client-side filtering fallback
  setupPublishedUserStoriesListenerWithClientFiltering(userId: string) {
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
            const author = await this.getUserById(storyData.authorId);
            
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
  },

  // Stories real-time listener
  setupStoriesListener() {
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
          const author = await this.getUserById(storyData.authorId);
          
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
  },

  // Liked stories real-time listener
  setupLikedStoriesListener() {
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
          snapshot.docs.map(likeDoc => this.getStoryById(likeDoc.data().storyId))
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
  },

  // Saved stories real-time listener
  setupSavedStoriesListener() {
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
          snapshot.docs.map(saveDoc => this.getStoryById(saveDoc.data().storyId))
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
  },

  // Comments real-time listener
  setupCommentsListener(storyId: string) {
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
            const user = await this.getUserById(commentData.userId);
            
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
  },

  // Story detail real-time listener
  setupStoryDetailListener(storyId: string) {
    try {
      const firestore = getFirestore();
      const storyRef = doc(firestore, 'stories', storyId);

      const unsubscribe = onSnapshot(storyRef, async (snapshot) => {
        if (snapshot.exists()) {
          const storyData = snapshot.data() as Story;
          const author = await this.getUserById(storyData.authorId);
          
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
  },

  // Story CRUD operations
  async createStory(storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount' | 'author'>) {
    try {
      storyState$.isLoading.set(true);
      const { user } = authState$.get();
      
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
        await this.updateUserStoriesCount(user.id, 1);

        // Takipçilere "yeni hikâye" duyurusu — arka planda, akışı bloklamaz
        notificationActions.announceStoryToFollowers(
          user.id,
          user.displayName || user.username || 'Takip ettiğin bir yazar',
          docRef.id,
          storyData.title,
          'new_story'
        ).catch(() => {});

        analytics().logEvent('story_publish', { story_id: docRef.id }).catch(() => {});
      }

      storyState$.isLoading.set(false);
      return { success: true, storyId: docRef.id };
    } catch (error) {
      console.error('Create story error:', error);
      storyState$.isLoading.set(false);
      storyState$.error.set(error instanceof Error ? error.message : 'Story creation failed');
      return { success: false, error: error instanceof Error ? error.message : 'Story creation failed' };
    }
  },

  async updateStory(storyId: string, updates: Partial<Story>) {
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
        await this.updateUserStoriesCount(currentStoryData.authorId, 1);
      }

      // Takipçi duyuruları (arka planda): taslak→yayın geçişi "yeni hikâye",
      // yayındaki hikâyeye bölüm eklenmesi "yeni bölüm" bildirimi üretir.
      const { user } = authState$.get();
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
          analytics().logEvent('story_publish', { story_id: storyId }).catch(() => {});
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
  },

  async deleteStory(storyId: string) {
    try {
      const { user } = authState$.get();
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
      // kuralları yazar kontrolü için hikâye dokümanına bakar.
      const likesSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'likes'));
      await Promise.all(likesSnapshot.docs.map((d: any) => deleteDoc(d.ref)));

      const viewsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'views'));
      await Promise.all(viewsSnapshot.docs.map((d: any) => deleteDoc(d.ref)));

      // Yorumlar + her yorumun beğeni alt koleksiyonu
      const commentsSnapshot = await getDocs(collection(firestore, 'stories', storyId, 'comments'));
      await Promise.all(commentsSnapshot.docs.map(async (commentDoc: any) => {
        const commentLikes = await getDocs(collection(firestore, 'stories', storyId, 'comments', commentDoc.id, 'likes'));
        await Promise.all(commentLikes.docs.map((d: any) => deleteDoc(d.ref)));
        await deleteDoc(commentDoc.ref);
      }));

      // En son hikâyenin kendisini sil
      await deleteDoc(storyRef);

      // Update user's stories count only if it was published
      if (wasPublished) {
        await this.updateUserStoriesCount(user.id, -1);
      }

      return { success: true };
    } catch (error) {
      console.error('Delete story error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Story deletion failed' };
    }
  },

  // Like/Unlike story
  // Optimistic: UI'yi anında günceller, Firebase işini arka planda yürütür.
  // Sayaç, tüm `likes` koleksiyonunu okumak yerine atomik increment() ile
  // güncellenir (her dokunuşta O(n) okuma yapmaz).
  async likeStory(storyId: string) {
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
      this.applyLikeDelta(storyId, wasLiked ? -1 : 1);

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
      this.performLikeStoryFirebaseOperation(storyId, user.id);

      return { success: true };
    } catch (error) {
      console.error('Like story error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Like operation failed' };
    }
  },

  // Bir hikâyenin likesCount'unu tüm feed state'lerinde + currentStory'de değiştir.
  applyLikeDelta(storyId: string, delta: number) {
    const upd = (arr: Story[]) =>
      arr.map(s => s.id === storyId ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) + delta) } : s);
    storyState$.stories.set(upd);
    storyState$.discoverStories.set(upd);
    storyState$.followingStories.set(upd);
    const cur = storyState$.currentStory.get();
    if (cur && cur.id === storyId) {
      storyState$.currentStory.set({ ...cur, likesCount: Math.max(0, (cur.likesCount || 0) + delta) });
    }
  },

  // Firebase like işlemlerini arka planda yap (server durumunu otorite kabul eder)
  async performLikeStoryFirebaseOperation(storyId: string, userId: string) {
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
        this.sendLikeNotification(storyId, userId);
      }
    } catch (error) {
      console.error('Firebase like operation error:', error);
      // Hata durumunda server gerçeğinden yeniden eşitle
      this.refreshLikedStoriesState();
      this.updateStoryLikesCount(storyId);
    }
  },

  // Bildirim gönderme işlemini arka planda yap
  async sendLikeNotification(storyId: string, userId: string) {
    try {
      const { user } = authState$.get();
      if (!user) return;

      const storyData = await this.getStoryById(storyId);
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
  },

  // UI'yi geri al (hata durumunda)
  revertLikeStoryUI(storyId: string) {
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
  },

  async isStoryLiked(storyId: string): Promise<boolean> {
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
  },

  // Save/Unsave story
  async saveStory(storyId: string) {
    try {
      const { user } = authState$.get();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Önce UI'yi hemen güncelle (optimistic update)
      const currentStories = storyState$.stories.get();
      const story = currentStories.find(s => s.id === storyId);
      const isCurrentlySaved = storyState$.savedStories.get().some(s => s.id === storyId);
      
      if (isCurrentlySaved) {
        // Unsave - UI'yi hemen güncelle
        storyState$.savedStories.set(prev => prev.filter(s => s.id !== storyId));
      } else {
        // Save - UI'yi hemen güncelle
        if (story) {
          storyState$.savedStories.set(prev => [...prev, story]);
        }
      }

      // Firebase işlemlerini arka planda yap
      this.performSaveStoryFirebaseOperation(storyId, user.id);
      
      return { success: true };
    } catch (error) {
      console.error('Save story error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Save operation failed' };
    }
  },

  // Firebase save işlemlerini arka planda yap.
  // Kayıt dokümanı deterministik ID kullanır (savedStories/{storyId}) —
  // eski sürümler addDoc ile rastgele ID yazdığından, geri alma her iki
  // formattaki kayıtları da siler (aksi hâlde kayıt sunucuda kalıyordu).
  async performSaveStoryFirebaseOperation(storyId: string, userId: string) {
    try {
      const firestore = getFirestore();
      const savesRef = collection(firestore, 'users', userId, 'savedStories');
      const saveRef = doc(savesRef, storyId);

      // Check if already saved (matches both id formats via the storyId field)
      const saveDocs = await getDocs(query(savesRef, where('storyId', '==', storyId)));

      if (!saveDocs.empty) {
        // Unsave — legacy rastgele ID'li kayıtlar dahil hepsini sil
        await Promise.all(saveDocs.docs.map(d => deleteDoc(d.ref)));
      } else {
        // Save
        await setDoc(saveRef, {
          storyId,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Firebase save operation error:', error);
      // Hata durumunda UI'yi geri al
      this.revertSaveStoryUI(storyId);
    }
  },

  // UI'yi geri al (hata durumunda)
  revertSaveStoryUI(storyId: string) {
    const isCurrentlySaved = storyState$.savedStories.get().some(s => s.id === storyId);
    const currentStories = storyState$.stories.get();
    const story = currentStories.find(s => s.id === storyId);
    
    if (isCurrentlySaved) {
      // Geri al: unsave yapılmışsa save'a çevir
      if (story) {
        storyState$.savedStories.set(prev => [...prev, story]);
      }
    } else {
      // Geri al: save yapılmışsa unsave'a çevir
      storyState$.savedStories.set(prev => prev.filter(s => s.id !== storyId));
    }
  },

  async isStorySaved(storyId: string): Promise<boolean> {
    try {
      const { user } = authState$.get();
      if (!user?.id) return false;

      // Önce local state'i kontrol et (daha hızlı)
      const savedStories = storyState$.savedStories.get();
      const isSaved = savedStories.some(story => story.id === storyId);
      
      if (savedStories.length > 0) {
        return isSaved;
      }

      // Local state boşsa Firebase'den kontrol et
      const firestore = getFirestore();
      const savesQuery = query(
        collection(firestore, 'users', user.id, 'savedStories'),
        where('storyId', '==', storyId)
      );
      
      const snapshot = await getDocs(savesQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Check story save error:', error);
      return false;
    }
  },

  // Comment operations
  async addComment(storyId: string, content: string, parentId?: string) {
    try {
      const { user } = authState$.get();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const firestore = getFirestore();
      const commentsRef = collection(firestore, 'stories', storyId, 'comments');
      const storyRef = doc(firestore, 'stories', storyId);
      
      const newComment = {
        storyId,
        userId: user.id,
        content,
        likesCount: 0,
        isEdited: false,
        parentId: parentId || null, // Yanıt ise parentId ekle
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(commentsRef, newComment);
      
      // Update story comments count
      await updateDoc(storyRef, {
        commentsCount: increment(1),
      });
      
      // Send notification to story author (only for top-level comments)
      if (!parentId) {
        const storyData = await this.getStoryById(storyId);
        if (storyData && storyData.authorId !== user.id) {
          // Bildirim işlemlerini paralel yap
          Promise.all([
            notificationActions.createCommentNotification(
              user.id,
              storyData.authorId,
              user.displayName || user.username || "Bir kullanıcı",
              storyData.title,
              storyId,
              content
            ),
            // Push notification gönder
            pushNotificationService.sendNotificationToUser(
              storyData.authorId,
              "Yeni Yorum!",
              `${
                user.displayName || user.username || "Bir kullanıcı"
              } hikayene yorum yaptı: ${content}`,
              { type: "story", storyId }
            ),
          ]).catch((error) => {
            console.error("Comment notification error:", error);
            // Push notification hatası ana işlemi engellemesin
          });
        }
      } else {
        // Yanıt ise, yanıtlanan yorumun sahibine bildirim gönder
        const parentComment = await this.getCommentById(storyId, parentId);
        const storyData = await this.getStoryById(storyId);
        if (parentComment && parentComment.userId !== user.id) {
          Promise.all([
            notificationActions.createCommentNotification(
              user.id,
              parentComment.userId,
              user.displayName || user.username || "Bir kullanıcı",
              storyData?.title || "Bir hikaye",
              storyId,
              content
            ),
            // Push notification gönder
            pushNotificationService.sendNotificationToUser(
              parentComment.userId,
              "Yeni Yanıt!",
              `${
                user.displayName || user.username || "Bir kullanıcı"
              } yorumuna yanıt verdi: ${content}`,
              { type: "story", storyId }
            ),
          ]).catch((error) =>
            console.error("Reply notification error:", error)
          );
        }
      }
      
      // Görev takibi
      if (!parentId) {
        const { challengeActions } = require('./challengeStore');
        challengeActions.trackAction(user.id, 'commentsPosted').catch(() => {});
      }

      return { success: true, commentId: docRef.id };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Comment creation failed' };
    }
  },

  async updateComment(storyId: string, commentId: string, content: string) {
    try {
      const firestore = getFirestore();
      const commentRef = doc(firestore, 'stories', storyId, 'comments', commentId);
      
      await updateDoc(commentRef, {
        content,
        isEdited: true,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update comment error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Comment update failed' };
    }
  },

  async deleteComment(storyId: string, commentId: string) {
    try {
      const firestore = getFirestore();
      const commentsRef = collection(firestore, 'stories', storyId, 'comments');
      const commentRef = doc(commentsRef, commentId);
      const storyRef = doc(firestore, 'stories', storyId);

      // Yoruma ait beğenileri temizle
      const deleteCommentLikes = async (cid: string) => {
        const likes = await getDocs(collection(firestore, 'stories', storyId, 'comments', cid, 'likes'));
        await Promise.all(likes.docs.map((d: any) => deleteDoc(d.ref)));
      };

      // Yanıtları da sil — eskiden yetim kalıyor ve sayaç kayıyordu.
      // NOT: yanıt silme, hikâye yazarı veya yanıt sahibi değilsek kurallara
      // takılabilir; o durumda yanıt görünmez kalır ama akış bozulmaz.
      const repliesSnapshot = await getDocs(query(commentsRef, where('parentId', '==', commentId)));
      let deletedCount = 0;
      await Promise.all(repliesSnapshot.docs.map(async (replyDoc: any) => {
        try {
          await deleteCommentLikes(replyDoc.id);
          await deleteDoc(replyDoc.ref);
          deletedCount += 1;
        } catch (e) {
          console.warn('Reply cleanup skipped:', replyDoc.id, e);
        }
      }));

      // Delete comment (+ its likes)
      await deleteCommentLikes(commentId);
      await deleteDoc(commentRef);
      deletedCount += 1;

      // Update story comments count — silinen yorum + yanıtları kadar azalt
      await updateDoc(storyRef, {
        commentsCount: increment(-deletedCount),
      });

      return { success: true };
    } catch (error) {
      console.error('Delete comment error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Comment deletion failed' };
    }
  },

  async likeComment(storyId: string, commentId: string) {
    try {
      const { user } = authState$.get();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const firestore = getFirestore();
      const likesRef = collection(firestore, 'stories', storyId, 'comments', commentId, 'likes');
      const likeRef = doc(likesRef, user.id);
      const commentRef = doc(firestore, 'stories', storyId, 'comments', commentId);

      // Check if already liked (matches both deterministic and legacy addDoc ids)
      const likeDocs = await getDocs(query(likesRef, where('userId', '==', user.id)));

      if (!likeDocs.empty) {
        // Unlike — bulunan tüm kayıtları sil; sayaç yalnızca gerçekten
        // silinen kayıt başına bir kez azalır (eskiden yanlış ID silindiği
        // için kayıt kalıyor ve sayaç tekrar tekrar eksiltilebiliyordu).
        await Promise.all(likeDocs.docs.map(d => deleteDoc(d.ref)));
        await updateDoc(commentRef, {
          likesCount: increment(-1),
        });
      } else {
        // Like — deterministik ID (likes/{userId}) çift kaydı engeller
        await setDoc(likeRef, {
          userId: user.id,
          createdAt: serverTimestamp(),
        });

        await updateDoc(commentRef, {
          likesCount: increment(1),
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Like comment error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Comment like operation failed' };
    }
  },

  // Fetch operations
  async getStoryById(storyId: string): Promise<Story | null> {
    try {
      if (!storyId || typeof storyId !== 'string') return null;
      const firestore = getFirestore();
      // Doğrudan doküman okuması — __name__ sorgusundan daha ucuz/hızlı.
      const storySnap = await getDoc(doc(firestore, 'stories', storyId));

      if (storySnap.exists()) {
        const storyData = storySnap.data() as Story;
        const author = await this.getUserById(storyData.authorId);

        return {
          ...storyData,
          id: storySnap.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        };
      }

      return null;
    } catch (error) {
      console.error('Get story error:', error);
      return null;
    }
  },

  async getCommentById(storyId: string, commentId: string): Promise<Comment | null> {
    try {
      const firestore = getFirestore();
      const commentDoc = await getDoc(doc(firestore, 'stories', storyId, 'comments', commentId));
      
      if (commentDoc.exists()) {
        const commentData = commentDoc.data() as Comment;
        const user = await this.getUserById(commentData.userId);
        
        return {
          ...commentData,
          id: commentDoc.id,
          user: user || { id: '', email: '', displayName: '', authProvider: 'email' },
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get comment by id error:', error);
      return null;
    }
  },

  async loadStoryComments(storyId: string) {
    try {
      const firestore = getFirestore();
      const commentsQuery = query(
        collection(firestore, 'stories', storyId, 'comments'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(commentsQuery);
      const allComments: Comment[] = [];
      const commentsMap = new Map<string, Comment>();
      
      // Önce tüm yorumları yükle
      for (const commentDoc of snapshot.docs) {
        const commentData = commentDoc.data() as Comment;
        
        // Check if userId exists before calling getUserById
        if (commentData.userId) {
          const user = await this.getUserById(commentData.userId);
          
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
    } catch (error) {
      console.error('Load comments error:', error);
    }
  },

  async loadUserStories(userId: string) {
    try {
      storyState$.isLoading.set(true);
      const firestore = getFirestore();
      const storiesQuery = query(
        collection(firestore, 'stories'),
        where('authorId', '==', userId)
      );
      
      const snapshot = await getDocs(storiesQuery);
      const stories: Story[] = [];
      
      for (const storyDoc of snapshot.docs) {
        const storyData = storyDoc.data() as Story;
        const author = await this.getUserById(storyData.authorId);
        
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
      
      storyState$.userStories.set(stories);
    } catch (error) {
      console.error('Load user stories error:', error);
    } finally {
      storyState$.isLoading.set(false);
    }
  },

  async loadPublishedUserStories(userId: string) {
    try {
      storyState$.isLoading.set(true);
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
        const author = await this.getUserById(storyData.authorId);
        
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
      storyState$.isLoading.set(false);
    }
  },

  async loadSavedStories() {
    try {
      const { user } = authState$.get();
      if (!user?.id) return;

      const firestore = getFirestore();
      const savesQuery = query(
        collection(firestore, 'users', user.id, 'savedStories'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(savesQuery);
      const fetched = await Promise.all(
        snapshot.docs.map(saveDoc => this.getStoryById(saveDoc.data().storyId))
      );
      storyState$.savedStories.set(fetched.filter((s): s is Story => !!s));
    } catch (error) {
      console.error('Load saved stories error:', error);
    }
  },

  async loadLikedStories() {
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
        snapshot.docs.map(likeDoc => this.getStoryById(likeDoc.data().storyId))
      );
      storyState$.likedStories.set(fetched.filter((s): s is Story => !!s));
    } catch (error) {
      console.error('Load liked stories error:', error);
    }
  },

  // Helper functions
  async getUserById(userId: string): Promise<User | null> {
    try {
      if (!userId || typeof userId !== 'string') {
        console.warn('Invalid userId provided to getUserById:', userId);
        return null;
      }

      // Serve from cache when fresh
      const cached = userCache.get(userId);
      if (cached && Date.now() - cached.ts < USER_CACHE_TTL) {
        return cached.user;
      }

      // Direct document read (cheaper/faster than a __name__ query)
      const firestore = getFirestore();
      const userDoc = await getDoc(doc(firestore, 'users', userId));

      const user = userDoc.exists()
        ? ({ ...(userDoc.data() as User), id: userDoc.id })
        : null;

      userCache.set(userId, { user, ts: Date.now() });
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Adjusts the author's published-story counter by `delta` (+1 / -1).
  // NOTE: the param used to be named `increment`, which shadowed the imported
  // Firestore `increment()` helper — so this *set* storiesCount to a literal
  // 1 or -1 instead of incrementing it. We use the atomic increment field-value
  // so the count only ever reflects published stories.
  async updateUserStoriesCount(userId: string, delta: number) {
    try {
      const firestore = getFirestore();
      const userRef = doc(firestore, 'users', userId);

      await updateDoc(userRef, {
        storiesCount: increment(delta),
      });
    } catch (error) {
      console.error('Update user stories count error:', error);
    }
  },

  // Story likes count'ını Firebase'den güncelle
  async updateStoryLikesCount(storyId: string) {
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
  },

  // LikedStories state'ini Firebase'den yenile
  async refreshLikedStoriesState() {
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
        snapshot.docs.map(likeDoc => this.getStoryById(likeDoc.data().storyId))
      );
      storyState$.likedStories.set(fetched.filter((s): s is Story => !!s));
    } catch (error) {
      console.error('Refresh liked stories state error:', error);
    }
  },

  // Book CRUD operations
  async createBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount' | 'author'>) {
    try {
      storyState$.isLoading.set(true);
      const { user } = authState$.get();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const firestore = getFirestore();
      const booksRef = collection(firestore, 'books');
      
      const newBook = {
        ...bookData,
        authorId: user.id,
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(booksRef, newBook);
      
      // Update user's stories count only for published books
      if (bookData.isPublished) {
        await this.updateUserStoriesCount(user.id, 1);
      }
      
      storyState$.isLoading.set(false);
      return { success: true, bookId: docRef.id };
    } catch (error) {
      console.error('Create book error:', error);
      storyState$.isLoading.set(false);
      storyState$.error.set(error instanceof Error ? error.message : 'Book creation failed');
      return { success: false, error: error instanceof Error ? error.message : 'Book creation failed' };
    }
  },

  async createChapter(bookId: string, chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const firestore = getFirestore();
      const chaptersRef = collection(firestore, 'books', bookId, 'chapters');
      
      const newChapter = {
        ...chapterData,
        bookId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(chaptersRef, newChapter);
      
      return { success: true, chapterId: docRef.id };
    } catch (error) {
      console.error('Create chapter error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Chapter creation failed' };
    }
  },

  async loadUserBooks(userId: string): Promise<Book[]> {
    try {
      const firestore = getFirestore();
      const booksQuery = query(
        collection(firestore, 'books'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(booksQuery);
      const books: Book[] = [];
      
      for (const bookDoc of snapshot.docs) {
        const bookData = bookDoc.data() as Book;
        const author = await this.getUserById(bookData.authorId);
        
        books.push({
          ...bookData,
          id: bookDoc.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        });
      }
      
      return books;
    } catch (error) {
      console.error('Load user books error:', error);
      return [];
    }
  },

  async deleteBook(bookId: string) {
    try {
      const { user } = authState$.get();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const firestore = getFirestore();
      const bookRef = doc(firestore, 'books', bookId);
      
      // Delete book
      await deleteDoc(bookRef);
      
      // Delete all chapters for this book
      const chaptersRef = collection(firestore, 'books', bookId, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersRef);
      const deleteChaptersPromises = chaptersSnapshot.docs.map((doc: any) => deleteDoc(doc.ref));
      await Promise.all(deleteChaptersPromises);
      
      // Delete all likes for this book
      const likesRef = collection(firestore, 'books', bookId, 'likes');
      const likesSnapshot = await getDocs(likesRef);
      const deleteLikesPromises = likesSnapshot.docs.map((doc: any) => deleteDoc(doc.ref));
      await Promise.all(deleteLikesPromises);
      
      // Delete all comments for this book
      const commentsRef = collection(firestore, 'books', bookId, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      const deleteCommentsPromises = commentsSnapshot.docs.map((doc: any) => deleteDoc(doc.ref));
      await Promise.all(deleteCommentsPromises);
      
      // Get book data to check if it was published
      const bookDoc = await getDoc(bookRef);
      if (bookDoc.exists()) {
        const bookData = bookDoc.data() as Book;
        // Update user's stories count only if it was published
        if (bookData.isPublished) {
          await this.updateUserStoriesCount(user.id, -1);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Delete book error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Book deletion failed' };
    }
  },

  // Keşfet algoritması - Popüler hikayeleri getir
  async loadDiscoverStories() {
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
        const author = await this.getUserById(storyData.authorId);
        
        const story = {
          ...storyData,
          id: storyDoc.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        };
        
        // Popülerlik skoru hesapla
        const popularityScore = this.calculatePopularityScore(story);
        
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
  },

  // Popülerlik skoru hesaplama algoritması
  calculatePopularityScore(story: Story): number {
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
  },

  // Takip edilen kullanıcıların hikayelerini getir
  async loadFollowingStories() {
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
      const chunks = this.chunkArray(followingUserIds, 10);
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
          const author = await this.getUserById(storyData.authorId);
          
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
  },

  // Yardımcı fonksiyon: Array'i chunk'lara böl
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Keşfet hikayelerini yenile
  async refreshDiscoverStories() {
    await this.loadDiscoverStories();
  },

  // Takip edilen hikayeleri yenile
  async refreshFollowingStories() {
    await this.loadFollowingStories();
  },

  // Hikaye görüntülenme sayısını artır (kullanıcı bazlı limit ile)
  async incrementStoryViews(storyId: string) {
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
  },

  // Hikayenin benzersiz okuyucu sayısını getir
  async getUniqueReadersCount(storyId: string): Promise<number> {
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
  },

  // ===== OFFLINE STORY MANAGEMENT =====

  // Offline hikayeleri yükle
  async loadOfflineStories() {
    try {
      const offlineStories = await offlineStorageService.getOfflineStories();
      storyState$.offlineStories.set(offlineStories);
    } catch (error) {
      console.error('Load offline stories error:', error);
    }
  },

  // Hikayeyi offline indir
  async downloadStoryOffline(story: Story): Promise<{ success: boolean; error?: string }> {
    try {
      // İndirme durumunu başlat
      storyState$.isDownloading.set(prev => ({
        ...prev,
        [story.id]: 0
      }));

      // Progress listener'ı kur
      const progressInterval = setInterval(async () => {
        const progress = await offlineStorageService.getDownloadProgress(story.id);
        if (progress) {
          storyState$.isDownloading.set(prev => ({
            ...prev,
            [story.id]: progress.progress
          }));

          if (progress.status === 'completed' || progress.status === 'failed') {
            clearInterval(progressInterval);
            // İndirme durumunu temizle
            storyState$.isDownloading.set(prev => {
              const newState = { ...prev };
              delete newState[story.id];
              return newState;
            });
          }
        }
      }, 100);

      // Hikayeyi indir
      const result = await offlineStorageService.downloadStory(story);
      
      if (result.success) {
        // Offline hikayeleri yenile
        await this.loadOfflineStories();
      }

      return result;
    } catch (error) {
      console.error('Download story offline error:', error);
      return { success: false, error: 'İndirme sırasında hata oluştu' };
    }
  },

  // Offline hikayeyi sil
  async deleteOfflineStory(storyId: string): Promise<boolean> {
    try {
      const success = await offlineStorageService.deleteOfflineStory(storyId);
      if (success) {
        // State'i güncelle
        storyState$.offlineStories.set(prev => 
          prev.filter(story => story.id !== storyId)
        );
      }
      return success;
    } catch (error) {
      console.error('Delete offline story error:', error);
      return false;
    }
  },

  // Hikayenin offline olup olmadığını kontrol et
  async isStoryOffline(storyId: string): Promise<boolean> {
    try {
      return await offlineStorageService.isStoryOffline(storyId);
    } catch (error) {
      console.error('Check story offline error:', error);
      return false;
    }
  },

  // Offline hikayeyi getir (internet olmadan)
  async getOfflineStory(storyId: string): Promise<Story | null> {
    try {
      return await offlineStorageService.getOfflineStory(storyId);
    } catch (error) {
      console.error('Get offline story error:', error);
      return null;
    }
  },

  // Offline storage bilgilerini getir
  async getOfflineStorageInfo(): Promise<{ used: number; total: number; count: number }> {
    try {
      const sizeInfo = await offlineStorageService.getTotalStorageSize();
      const offlineStories = await offlineStorageService.getOfflineStories();
      
      return {
        used: sizeInfo.used,
        total: sizeInfo.total,
        count: offlineStories.length,
      };
    } catch (error) {
      console.error('Get offline storage info error:', error);
      return { used: 0, total: 500 * 1024, count: 0 };
    }
  },

  // Tüm offline verileri temizle
  async clearAllOfflineData(): Promise<boolean> {
    try {
      const success = await offlineStorageService.clearAllOfflineData();
      if (success) {
        storyState$.offlineStories.set([]);
        storyState$.isDownloading.set({});
      }
      return success;
    } catch (error) {
      console.error('Clear all offline data error:', error);
      return false;
    }
  },

  // Eski offline hikayeleri temizle
  async cleanupOldOfflineStories(): Promise<number> {
    try {
      const removedCount = await offlineStorageService.cleanupOldStories();
      if (removedCount > 0) {
        // State'i güncelle
        await this.loadOfflineStories();
      }
      return removedCount;
    } catch (error) {
      console.error('Cleanup old offline stories error:', error);
      return 0;
    }
  },

  // İndirme progress'ini getir
  getDownloadProgress(storyId: string): number {
    return storyState$.isDownloading.get()[storyId] || 0;
  },

  // Hikayenin indirilip indirilmediğini kontrol et
  isStoryDownloading(storyId: string): boolean {
    return storyId in storyState$.isDownloading.get();
  },

  // ===== OFFLINE-AWARE STORY FETCHING =====

  // Hikayeyi getir (offline fallback ile)
  async getStoryWithOfflineFallback(storyId: string): Promise<Story | null> {
    try {
      // Önce internet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

      if (isOnline) {
        // Online ise Firebase'den getir
        const onlineStory = await this.getStoryById(storyId);
        if (onlineStory) {
          return onlineStory;
        }
      }

      // Offline ise veya online'da bulunamazsa offline'dan getir
      console.log('Fetching story from offline storage:', storyId);
      const offlineStory = await this.getOfflineStory(storyId);
      return offlineStory;
    } catch (error) {
      console.error('Get story with offline fallback error:', error);
      // Hata durumunda offline'dan getir
      return await this.getOfflineStory(storyId);
    }
  },

  // Hikayeleri listele (offline aware)
  async getStoriesWithOfflineFallback(): Promise<{ 
    stories: Story[]; 
    isFromCache: boolean; 
    offlineCount: number;
  }> {
    try {
      // Önce internet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

      // Offline hikayeleri her zaman yükle
      const offlineStories = await offlineStorageService.getOfflineStories();

      if (isOnline) {
        // Online ise normal hikayeleri getir
        const currentStories = storyState$.stories.get();
        return {
          stories: currentStories,
          isFromCache: false,
          offlineCount: offlineStories.length,
        };
      } else {
        // Offline ise sadece offline hikayeleri göster
        return {
          stories: offlineStories,
          isFromCache: true,
          offlineCount: offlineStories.length,
        };
      }
    } catch (error) {
      console.error('Get stories with offline fallback error:', error);
      // Hata durumunda offline hikayeleri döndür
      const offlineStories = await offlineStorageService.getOfflineStories();
      return {
        stories: offlineStories,
        isFromCache: true,
        offlineCount: offlineStories.length,
      };
    }
  },

  // Internet bağlantısını kontrol et
  async checkInternetConnection(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return Boolean(netInfo.isConnected && netInfo.isInternetReachable);
    } catch (error) {
      console.error('Check internet connection error:', error);
      return false;
    }
  },

  // Offline mode banner için bilgi
  async getOfflineModeInfo(): Promise<{
    isOffline: boolean;
    offlineStoriesCount: number;
    lastSync?: Date;
  }> {
    try {
      const isOnline = await this.checkInternetConnection();
      const offlineStories = await offlineStorageService.getOfflineStories();
      
      return {
        isOffline: !isOnline,
        offlineStoriesCount: offlineStories.length,
        lastSync: offlineStories.length > 0 
          ? new Date(Math.max(...offlineStories.map(s => new Date(s.downloadedAt || 0).getTime())))
          : undefined,
      };
    } catch (error) {
      console.error('Get offline mode info error:', error);
      return {
        isOffline: true,
        offlineStoriesCount: 0,
      };
    }
  },
}; 
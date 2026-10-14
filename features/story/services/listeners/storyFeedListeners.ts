import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { collection, getDocs, getFirestore, limit, onSnapshot, orderBy, query, where } from '@react-native-firebase/firestore';
import { getUserById } from '../userCache';
import { fallbackAuthor, storyFromSnapshot } from './storySnapshot';

/**
 * Ana akış artık canlı dinlenmez, tek seferlik okunur.
 *
 * Neden: `stories` dokümanları sayaçlar yüzünden sürekli değişiyor (her
 * okumada viewsCount). Canlı dinleyicide her değişiklik, uygulamayı o an açık
 * tutan HER istemciye ayrı bir okuma olarak faturalanıyordu; eşzamanlı
 * kullanıcı arttıkça okuma sayısı çarpılarak büyüyordu. Yeni hikâyeler aşağı
 * çekince, sekmeye 10 dakikadan sonra dönünce ve yazar yayınladığında gelir.
 */
const FEED_TTL_MS = 10 * 60 * 1000;
const FEED_SIZE = 50;

const feed = {
  loadedAt: 0,
  inFlight: null as Promise<void> | null,
};

const listeners = {
  published: null as (() => void) | null,
  publishedUserId: null as string | null,
};

export function loadStoriesFeed(options: { force?: boolean } = {}): Promise<void> {
  if (feed.inFlight) return feed.inFlight;
  const fresh = Date.now() - feed.loadedAt < FEED_TTL_MS && store.getState().story.storiesLoaded;
  if (fresh && !options.force) return Promise.resolve();

  const source = query(
    collection(getFirestore(), 'stories'),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    limit(FEED_SIZE),
  );
  feed.inFlight = getDocs(source)
    .then(snapshot => Promise.all(snapshot.docs.map(storyFromSnapshot)))
    .then(stories => {
      feed.loadedAt = Date.now();
      store.dispatch(patchStory({ stories, storiesLoaded: true }));
    })
    .catch(error => {
      logger.error('Load stories feed error:', error);
      store.dispatch(patchStory({ storiesLoaded: true }));
    })
    .finally(() => {
      feed.inFlight = null;
    });
  return feed.inFlight;
}

/**
 * Yazarın kendi değişikliği akışa anında yansısın (canlı dinleyici yokken):
 * `null` hikâyeyi akıştan çıkarır (silme), yayından kaldırma da çıkarır,
 * diğer güncellemeler yerinde birleştirilir.
 */
export function applyStoryChange(storyId: string, updates: Partial<Story> | null) {
  const { stories, followingStories } = store.getState().story;
  const removed = updates === null || updates.isPublished === false || updates.isHidden === true;
  const apply = (list: Story[]) => (removed
    ? list.filter(story => story.id !== storyId)
    : list.map(story => (story.id === storyId ? { ...story, ...updates } : story)));
  store.dispatch(patchStory({ stories: apply(stories), followingStories: apply(followingStories) }));
}

function setupPublishedWithClientFiltering(userId: string) {
  listeners.published?.();
  const source = query(
    collection(getFirestore(), 'stories'),
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  listeners.published = onSnapshot(source, snapshot => {
    void getUserById(userId).then(author => {
      const publishedUserStories = snapshot.docs
        .map(item => ({ ...(item.data() as Story), id: item.id }))
        .filter(story => story.isPublished)
        .map(story => ({ ...story, author: author || fallbackAuthor(userId) }));
      store.dispatch(patchStory({ publishedUserStories }));
    });
  }, error => logger.error('Published user stories listener error (client-side):', error));
}

export function setupPublishedUserStoriesListener(userId: string) {
  if (!userId) return;
  if (listeners.published && listeners.publishedUserId === userId) return listeners.published;
  listeners.published?.();
  listeners.publishedUserId = userId;
  try {
    const source = query(
      collection(getFirestore(), 'stories'),
      where('authorId', '==', userId),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
    );
    listeners.published = onSnapshot(source, snapshot => {
      void Promise.all(snapshot.docs.map(storyFromSnapshot)).then(publishedUserStories => {
        store.dispatch(patchStory({ publishedUserStories }));
      });
    }, error => {
      if (error.message.includes('failed-precondition')) setupPublishedWithClientFiltering(userId);
      else logger.error('Published user stories listener error:', error);
    });
    return listeners.published;
  } catch (error) {
    logger.error('Setup published user stories listener error:', error);
  }
}

export function cleanupStoryFeedListeners() {
  listeners.published?.();
  listeners.published = null;
  listeners.publishedUserId = null;
}

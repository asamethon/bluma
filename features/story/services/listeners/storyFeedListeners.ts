import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { collection, getFirestore, limit, onSnapshot, orderBy, query, where } from '@react-native-firebase/firestore';
import { getUserById } from '../userCache';
import { fallbackAuthor, storyFromSnapshot } from './storySnapshot';

const listeners = {
  feed: null as (() => void) | null,
  published: null as (() => void) | null,
  publishedUserId: null as string | null,
};

export function setupStoriesListener() {
  if (listeners.feed) return listeners.feed;
  try {
    const source = query(
      collection(getFirestore(), 'stories'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    listeners.feed = onSnapshot(source, snapshot => {
      void Promise.all(snapshot.docs.map(storyFromSnapshot)).then(stories => {
        store.dispatch(patchStory({ stories, storiesLoaded: true }));
      });
    }, error => {
      logger.error('Stories listener error:', error);
      store.dispatch(patchStory({ storiesLoaded: true }));
    });
    return listeners.feed;
  } catch (error) {
    logger.error('Setup stories listener error:', error);
  }
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
  listeners.feed?.();
  listeners.published?.();
  listeners.feed = null;
  listeners.published = null;
  listeners.publishedUserId = null;
}

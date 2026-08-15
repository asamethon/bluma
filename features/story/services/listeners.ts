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
import { moderationActions } from '../../../store/moderationStore';
import { loadDiscoverStories, loadFollowingStories } from './discover';
import { loadOfflineStories } from './offline';
import { getStoryById } from './storyApi';
import { getUserById } from './userCache';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';
import { logger } from '@/utils/logger';

let storiesUnsubscribe: (() => void) | null = null;
let likedStoriesUnsubscribe: (() => void) | null = null;
let savedStoriesUnsubscribe: (() => void) | null = null;
let commentsUnsubscribe: (() => void) | null = null;
let publishedUserStoriesUnsubscribe: (() => void) | null = null;

export function initializeRealTimeListeners() {
  setupStoriesListener();
  setupLikedStoriesListener();
  setupSavedStoriesListener();
  loadDiscoverStories();
  loadFollowingStories();
  loadOfflineStories();
}

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

export function setupPublishedUserStoriesListener(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      logger.debug('Invalid userId for published user stories listener');
      return;
    }

    if (publishedUserStoriesUnsubscribe) {
      publishedUserStoriesUnsubscribe();
      publishedUserStoriesUnsubscribe = null;
    }

    const firestore = getFirestore();
    const userStoriesQuery = query(
      collection(firestore, 'stories'),
      where('authorId', '==', userId),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );

    publishedUserStoriesUnsubscribe = onSnapshot(userStoriesQuery, async (snapshot) => {
      const publishedStoriesList: Story[] = await Promise.all(
        snapshot.docs.map(async (storyDoc) => {
          const storyData = storyDoc.data() as Story;
          const author = await getUserById(storyData.authorId);
          return {
            ...storyData,
            id: storyDoc.id,
            author: author || {
              id: storyData.authorId,
              email: '',
              displayName: 'Anonim',
              username: 'user',
              authProvider: 'email' as const,
            },
          };
        })
      );

      store.dispatch(patchStory({ publishedUserStories: publishedStoriesList }));
      logger.debug('Published user stories updated:', publishedStoriesList.length);
    }, (error) => {
      logger.error('Published user stories listener error:', error);
      if (error.message.includes('failed-precondition')) {
        logger.debug('Index not ready, using client-side filtering');
        setupPublishedUserStoriesListenerWithClientFiltering(userId);
      }
    });

  } catch (error) {
    logger.error('Error setting up published user stories listener:', error);
  }
}

export function setupPublishedUserStoriesListenerWithClientFiltering(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      logger.debug('Invalid userId for published user stories listener');
      return;
    }

    const firestore = getFirestore();
    const userStoriesQuery = query(
      collection(firestore, 'stories'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    publishedUserStoriesUnsubscribe = onSnapshot(userStoriesQuery, async (snapshot) => {
      const author = await getUserById(userId);
      const fallbackAuthor = {
        id: userId,
        email: '',
        displayName: 'Anonim',
        username: 'user',
        authProvider: 'email' as const,
      };

      const publishedStoriesList: Story[] = snapshot.docs
        .map(storyDoc => ({ ...(storyDoc.data() as Story), id: storyDoc.id }))
        .filter(storyData => storyData.isPublished)
        .map(storyData => ({ ...storyData, author: author || fallbackAuthor }));

      store.dispatch(patchStory({ publishedUserStories: publishedStoriesList }));
    }, (error) => {
      logger.error('Published user stories listener error (client-side):', error);
    });

  } catch (error) {
    logger.error('Error setting up published user stories listener (client-side):', error);
  }
}

export function setupStoriesListener() {
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
      const storiesList: Story[] = await Promise.all(
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

      store.dispatch(patchStory({ stories: storiesList }));
      store.dispatch(patchStory({ storiesLoaded: true }));
    }, (error) => {
      logger.error('Stories listener error:', error);
      store.dispatch(patchStory({ storiesLoaded: true }));
    });
  } catch (error) {
    logger.error('Setup stories listener error:', error);
  }
}

export function setupLikedStoriesListener() {
  if (likedStoriesUnsubscribe) return;
  try {
    const { user } = store.getState().auth;
    if (!user?.id) return;

    const firestore = getFirestore();
    const likesQuery = query(
      collection(firestore, 'users', user.id, 'likedStories'),
      orderBy('createdAt', 'desc')
    );

    likedStoriesUnsubscribe = onSnapshot(likesQuery, async (snapshot) => {
      const fetched = await Promise.all(
        snapshot.docs.map(likeDoc => getStoryById(likeDoc.data().storyId))
      );
      store.dispatch(patchStory({ likedStories: fetched.filter((s): s is Story => !!s) }));
    }, (error: any) => {
      logger.error('Liked stories listener error:', error);

      if (error.code === 'firestore/permission-denied') {
        logger.debug('Liked stories listener: Firestore permission denied, continuing without real-time updates');
      }
    });
  } catch (error) {
    logger.error('Setup liked stories listener error:', error);
  }
}

export function setupSavedStoriesListener() {
  if (savedStoriesUnsubscribe) return;
  try {
    const { user } = store.getState().auth;
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
      store.dispatch(patchStory({ savedStories: fetched.filter((s): s is Story => !!s) }));
    }, (error: any) => {
      logger.error('Saved stories listener error:', error);

      if (error.code === 'firestore/permission-denied') {
        logger.debug('Saved stories listener: Firestore permission denied, continuing without real-time updates');
      }
    });
  } catch (error) {
    logger.error('Setup saved stories listener error:', error);
  }
}

export const COMMENTS_PAGE_SIZE = 50;

let commentsStoryId: string | null = null;
let commentsPageSize = COMMENTS_PAGE_SIZE;

export function setupCommentsListener(storyId: string, pageSize: number = COMMENTS_PAGE_SIZE) {
  try {
    if (commentsUnsubscribe && commentsStoryId === storyId && commentsPageSize === pageSize) {
      return;
    }
    if (commentsUnsubscribe) {
      commentsUnsubscribe();
      commentsUnsubscribe = null;
    }
    commentsStoryId = storyId;
    commentsPageSize = pageSize;

    const firestore = getFirestore();
    const commentsQuery = query(
      collection(firestore, 'stories', storyId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    commentsUnsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const hasMore = snapshot.docs.length > pageSize;
      const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

      const EMPTY_USER = { id: '', email: '', displayName: '', authProvider: 'email' as const };
      const allComments: Comment[] = await Promise.all(
        docs.map(async (commentDoc) => {
          const commentData = commentDoc.data() as Comment;
          const user = commentData.userId ? await getUserById(commentData.userId) : null;
          return {
            ...commentData,
            id: commentDoc.id,
            user: user || EMPTY_USER,
            replies: [],
          } as Comment;
        })
      );

      const commentsMap = new Map<string, Comment>(allComments.map(c => [c.id, c]));

      const topLevelComments: Comment[] = [];

      for (const comment of allComments) {
        const parentComment = comment.parentId ? commentsMap.get(comment.parentId) : undefined;
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(comment);
        } else {
          topLevelComments.push(comment);
        }
      }

      for (const comment of topLevelComments) {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => {
            const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt);
            const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime();
          });
        }
      }

      const visibleComments = moderationActions
        .filterBlocked(topLevelComments)
        .map(c => ({ ...c, replies: c.replies ? moderationActions.filterBlocked(c.replies) : c.replies }));
      store.dispatch(patchStory({ storyComments: visibleComments, storyCommentsHasMore: hasMore }));
    }, (error) => {
      logger.error('Comments listener error:', error);
    });
  } catch (error) {
    logger.error('Setup comments listener error:', error);
  }
}

export function loadMoreComments() {
  if (!commentsStoryId) return;
  setupCommentsListener(commentsStoryId, commentsPageSize + COMMENTS_PAGE_SIZE);
}

export function cleanupCommentsListener() {
  if (commentsUnsubscribe) {
    commentsUnsubscribe();
    commentsUnsubscribe = null;
  }
  commentsStoryId = null;
  commentsPageSize = COMMENTS_PAGE_SIZE;
  store.dispatch(patchStory({ storyComments: [], storyCommentsHasMore: false }));
}

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

        store.dispatch(patchStory({ currentStory: story }));
      }
    }, (error) => {
      logger.error('Story detail listener error:', error);
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Setup story detail listener error:', error);
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
  loadMoreComments,
  cleanupCommentsListener,
  setupStoryDetailListener,
};

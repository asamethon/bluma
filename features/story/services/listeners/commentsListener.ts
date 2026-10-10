import { store } from '@/store';
import { moderationActions } from '@/store/moderationStore';
import { patchStory } from '@/store/slices/storySlice';
import type { Comment } from '@/types';
import { logger } from '@/utils/logger';
import { collection, getFirestore, limit, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { getUserById } from '../userCache';

const PAGE_SIZE = 50;
const listener = { pageSize: PAGE_SIZE, storyId: null as string | null, unsubscribe: null as (() => void) | null };
const emptyUser = { id: '', email: '', displayName: '', authProvider: 'email' as const };

const toMillis = (value: any) => {
  const date = value?.toDate?.() ?? new Date(value);
  return date.getTime();
};

async function enrichComments(documents: any[]) {
  return Promise.all(documents.map(async item => {
    const data = item.data() as Comment;
    const user = data.userId ? await getUserById(data.userId) : null;
    return { ...data, id: item.id, user: user || emptyUser, replies: [] } as Comment;
  }));
}

function buildTree(comments: Comment[]) {
  const byId = new Map(comments.map(comment => [comment.id, comment]));
  const roots: Comment[] = [];
  comments.forEach(comment => {
    const parent = comment.parentId ? byId.get(comment.parentId) : undefined;
    if (parent) parent.replies?.push(comment);
    else roots.push(comment);
  });
  roots.forEach(comment => comment.replies?.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)));
  return moderationActions.filterBlocked(roots).map(comment => ({
    ...comment,
    replies: comment.replies ? moderationActions.filterBlocked(comment.replies) : comment.replies,
  }));
}

export function setupCommentsListener(storyId: string, pageSize = PAGE_SIZE) {
  if (listener.unsubscribe && listener.storyId === storyId && listener.pageSize === pageSize) return;
  listener.unsubscribe?.();
  listener.storyId = storyId;
  listener.pageSize = pageSize;
  try {
    const source = query(
      collection(getFirestore(), 'stories', storyId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1),
    );
    listener.unsubscribe = onSnapshot(source, snapshot => {
      const hasMore = snapshot.docs.length > pageSize;
      const documents = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
      void enrichComments(documents).then(comments => {
        store.dispatch(patchStory({ storyComments: buildTree(comments), storyCommentsHasMore: hasMore }));
      });
    }, error => logger.error('Comments listener error:', error));
  } catch (error) {
    logger.error('Setup comments listener error:', error);
  }
}

export function loadMoreComments() {
  if (listener.storyId) setupCommentsListener(listener.storyId, listener.pageSize + PAGE_SIZE);
}

export function cleanupCommentsListener() {
  listener.unsubscribe?.();
  listener.unsubscribe = null;
  listener.storyId = null;
  listener.pageSize = PAGE_SIZE;
  store.dispatch(patchStory({ storyComments: [], storyCommentsHasMore: false }));
}

import { Comment } from '@/types';
import i18n from '@/i18n';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';
import { moderationActions } from '../../../store/moderationStore';
import { challengeActions } from '../../../store/challengeStore';
import { notificationActions } from '../../../store/notificationStore';
import { getStoryById } from './storyApi';
import { getUserById } from './userCache';
import { patchStory } from '@/store/slices/storySlice';
import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import { store } from '@/store';
import { logger } from '@/utils/logger';

export async function addComment(storyId: string, content: string, parentId?: string, chapterIndex?: number) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error(i18n.t('errors.loginRequired'));
    }

    const verified = await assertEmailVerified();
    if (!verified.ok) return { success: false, error: verified.error };

    const firestore = getFirestore();
    const commentsRef = collection(firestore, 'stories', storyId, 'comments');
    const storyRef = doc(firestore, 'stories', storyId);

    const newComment: Record<string, unknown> = {
      storyId,
      userId: user.id,
      content,
      likesCount: 0,
      isEdited: false,
      parentId: parentId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (typeof chapterIndex === 'number') {
      newComment.chapterIndex = chapterIndex;
    }

    const docRef = await addDoc(commentsRef, newComment);

    await updateDoc(storyRef, {
      commentsCount: increment(1),
    });

    if (!parentId) {
      const storyData = await getStoryById(storyId);
      if (storyData && storyData.authorId !== user.id) {
        notificationActions.createCommentNotification(
          user.id,
          storyData.authorId,
          user.displayName || user.username || i18n.t('notifications.someone'),
          storyData.title,
          storyId,
          content
        ).catch((error) => logger.error("Comment notification error:", error));
      }
    } else {
      const parentComment = await getCommentById(storyId, parentId);
      const storyData = await getStoryById(storyId);
      if (parentComment && parentComment.userId !== user.id) {
        notificationActions.createCommentNotification(
          user.id,
          parentComment.userId,
          user.displayName || user.username || i18n.t('notifications.someone'),
          storyData?.title || "Bir hikaye",
          storyId,
          content
        ).catch((error) => logger.error("Reply notification error:", error));
      }
    }

    if (!parentId) {
      challengeActions.trackAction(user.id, 'commentsPosted').catch(() => {});
    }

    return { success: true, commentId: docRef.id };
  } catch (error) {
    logger.error('Add comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.createFailed') };
  }
}

export async function updateComment(storyId: string, commentId: string, content: string) {
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
    logger.error('Update comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.updateFailed') };
  }
}

export async function deleteComment(storyId: string, commentId: string) {
  try {
    const firestore = getFirestore();
    const commentsRef = collection(firestore, 'stories', storyId, 'comments');
    const commentRef = doc(commentsRef, commentId);
    const storyRef = doc(firestore, 'stories', storyId);

    const deleteCommentLikes = async (cid: string) => {
      const likes = await getDocs(collection(firestore, 'stories', storyId, 'comments', cid, 'likes'));
      await Promise.all(likes.docs.map((d: any) => deleteDoc(d.ref)));
    };

    const repliesSnapshot = await getDocs(query(commentsRef, where('parentId', '==', commentId)));
    let deletedCount = 0;
    await Promise.all(repliesSnapshot.docs.map(async (replyDoc: any) => {
      try {
        await deleteCommentLikes(replyDoc.id);
        await deleteDoc(replyDoc.ref);
        deletedCount += 1;
      } catch (e) {
        logger.warn('Reply cleanup skipped:', replyDoc.id, e);
      }
    }));

    await deleteCommentLikes(commentId);
    await deleteDoc(commentRef);
    deletedCount += 1;

    await updateDoc(storyRef, {
      commentsCount: increment(-deletedCount),
    });

    return { success: true };
  } catch (error) {
    logger.error('Delete comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.deleteFailed') };
  }
}

export async function likeComment(storyId: string, commentId: string) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error(i18n.t('errors.loginRequired'));
    }

    const firestore = getFirestore();
    const likesRef = collection(firestore, 'stories', storyId, 'comments', commentId, 'likes');
    const likeRef = doc(likesRef, user.id);
    const commentRef = doc(firestore, 'stories', storyId, 'comments', commentId);

    const likeDocs = await getDocs(query(likesRef, where('userId', '==', user.id)));

    if (!likeDocs.empty) {
      await Promise.all(likeDocs.docs.map(d => deleteDoc(d.ref)));
      await updateDoc(commentRef, {
        likesCount: increment(-1),
      });
    } else {
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
    logger.error('Like comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.likeFailed') };
  }
}

export async function getCommentById(storyId: string, commentId: string): Promise<Comment | null> {
  try {
    const firestore = getFirestore();
    const commentDoc = await getDoc(doc(firestore, 'stories', storyId, 'comments', commentId));

    if (commentDoc.exists()) {
      const commentData = commentDoc.data() as Comment;
      const user = await getUserById(commentData.userId);

      return {
        ...commentData,
        id: commentDoc.id,
        user: user || { id: '', email: '', displayName: '', authProvider: 'email' },
      };
    }

    return null;
  } catch (error) {
    logger.error('Get comment by id error:', error);
    return null;
  }
}

export async function loadStoryComments(storyId: string) {
  try {
    const firestore = getFirestore();
    const commentsQuery = query(
      collection(firestore, 'stories', storyId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(commentsQuery);

    const EMPTY_USER = { id: '', email: '', displayName: '', authProvider: 'email' as const };
    const allComments: Comment[] = await Promise.all(
      snapshot.docs.map(async (commentDoc) => {
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
      if (comment.parentId) {
        const parentComment = commentsMap.get(comment.parentId);
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(comment);
        }
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
    store.dispatch(patchStory({ storyComments: visibleComments }));
  } catch (error) {
    logger.error('Load comments error:', error);
  }
}

export const commentsActions = {
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  getCommentById,
  loadStoryComments,
};

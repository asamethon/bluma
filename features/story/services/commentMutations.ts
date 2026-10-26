import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import i18n from '@/i18n';
import { store } from '@/store';
import { challengeActions } from '@/store/challengeStore';
import { notificationActions } from '@/store/notificationStore';
import { logger } from '@/utils/logger';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { getCommentById } from './commentRecords';
import { getStoryById } from './storyApi';
import { notifyMentions } from './commentMentions';

async function notifyComment(storyId: string, commentId: string, parentId: string | undefined, content: string, chapterIndex?: number) {
  const user = store.getState().auth.user;
  if (!user) return;
  const [story, parent] = await Promise.all([
    getStoryById(storyId),
    parentId ? getCommentById(storyId, parentId) : Promise.resolve(null),
  ]);
  const recipientId = parentId ? parent?.userId : story?.authorId;
  if (!recipientId || recipientId === user.id) return;
  void notificationActions.createCommentNotification(
    user.id,
    recipientId,
    user.displayName || user.username || i18n.t('notifications.someone'),
    story?.title || i18n.t('common.story'),
    storyId,
    content,
    commentId,
    parentId,
    chapterIndex,
  );
}

export async function addComment(storyId: string, content: string, parentId?: string, chapterIndex?: number) {
  try {
    const user = store.getState().auth.user;
    if (!user?.id) throw new Error(i18n.t('errors.loginRequired'));
    const verified = await assertEmailVerified();
    if (!verified.ok) return { success: false, error: verified.error };
    const db = getFirestore();
    const reference = await addDoc(collection(db, 'stories', storyId, 'comments'), {
      storyId,
      userId: user.id,
      content,
      likesCount: 0,
      isEdited: false,
      parentId: parentId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(typeof chapterIndex === 'number' ? { chapterIndex } : {}),
    });
    await updateDoc(doc(db, 'stories', storyId), { commentsCount: increment(1) });
    void notifyComment(storyId, reference.id, parentId, content, chapterIndex)
      .catch(error => logger.error('Comment notification error:', error));
    void notifyMentions({
      storyId,
      storyTitle: (await getStoryById(storyId))?.title || i18n.t('common.story'),
      commentId: reference.id,
      content,
      chapterIndex,
    }).catch(error => logger.error('Mention notification error:', error));
    if (!parentId) {
      try {
        const story = await getStoryById(storyId);
        if (story?.authorId && story.authorId !== user.id) {
          void challengeActions.trackAction(user.id, 'commentsPosted');
        }
      } catch {
        void challengeActions.trackAction(user.id, 'commentsPosted');
      }
    }
    return { success: true, commentId: reference.id };
  } catch (error) {
    logger.error('Add comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.createFailed') };
  }
}

async function deleteCommentDocument(storyId: string, reference: any) {
  try {
    const likes = await getDocs(collection(getFirestore(), 'stories', storyId, 'comments', reference.id, 'likes'));
    await Promise.all(likes.docs.map(item => deleteDoc(item.ref)));
    await deleteDoc(reference);
    return 1;
  } catch (error) {
    logger.warn('Comment cleanup skipped:', reference.id, error);
    return 0;
  }
}

export async function deleteComment(storyId: string, commentId: string) {
  try {
    const db = getFirestore();
    const comments = collection(db, 'stories', storyId, 'comments');
    const reference = doc(comments, commentId);
    const replies = await getDocs(query(comments, where('parentId', '==', commentId)));
    const deleted = await Promise.all([
      ...replies.docs.map(reply => deleteCommentDocument(storyId, reply.ref)),
      deleteCommentDocument(storyId, reference),
    ]);
    const count = deleted.reduce<number>((total, value) => total + value, 0);
    if (count) await updateDoc(doc(db, 'stories', storyId), { commentsCount: increment(-count) });
    return { success: true };
  } catch (error) {
    logger.error('Delete comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.deleteFailed') };
  }
}

export async function likeComment(storyId: string, commentId: string) {
  try {
    const userId = store.getState().auth.user?.id;
    if (!userId) throw new Error(i18n.t('errors.loginRequired'));
    const db = getFirestore();
    const like = doc(db, 'stories', storyId, 'comments', commentId, 'likes', userId);
    const comment = doc(db, 'stories', storyId, 'comments', commentId);
    if ((await getDoc(like)).exists()) {
      await updateDoc(comment, { likesCount: increment(-1) });
      await deleteDoc(like);
    } else {
      await setDoc(like, { userId, createdAt: serverTimestamp() });
      await updateDoc(comment, { likesCount: increment(1) });
    }
    return { success: true };
  } catch (error) {
    logger.error('Like comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('comments.likeFailed') };
  }
}



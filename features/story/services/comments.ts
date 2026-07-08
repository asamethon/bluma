import { Comment } from '@/types';
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
import { notificationActions } from '../../../store/notificationStore';
import { getStoryById } from './storyApi';
import { getUserById } from './userCache';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';

// Comment operations
export async function addComment(storyId: string, content: string, parentId?: string, chapterIndex?: number) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();
    const commentsRef = collection(firestore, 'stories', storyId, 'comments');
    const storyRef = doc(firestore, 'stories', storyId);

    const newComment: Record<string, unknown> = {
      storyId,
      userId: user.id,
      content,
      likesCount: 0,
      isEdited: false,
      parentId: parentId || null, // Yanıt ise parentId ekle
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Bölüm filtresi için (bkz. YAPILACAKLAR 2.3) — yalnızca belirtilmişse yaz.
    if (typeof chapterIndex === 'number') {
      newComment.chapterIndex = chapterIndex;
    }

    const docRef = await addDoc(commentsRef, newComment);

    // Update story comments count
    await updateDoc(storyRef, {
      commentsCount: increment(1),
    });

    // Bildirim yaz — push gönderimi VPS'teki push-worker'ın işi (bkz.
    // YAPILACAKLAR 3.1). Yalnızca üst seviye yorumda hikâye yazarına gider.
    if (!parentId) {
      const storyData = await getStoryById(storyId);
      if (storyData && storyData.authorId !== user.id) {
        notificationActions.createCommentNotification(
          user.id,
          storyData.authorId,
          user.displayName || user.username || "Bir kullanıcı",
          storyData.title,
          storyId,
          content
        ).catch((error) => console.error("Comment notification error:", error));
      }
    } else {
      // Yanıt ise, yanıtlanan yorumun sahibine bildirim gönder
      const parentComment = await getCommentById(storyId, parentId);
      const storyData = await getStoryById(storyId);
      if (parentComment && parentComment.userId !== user.id) {
        notificationActions.createCommentNotification(
          user.id,
          parentComment.userId,
          user.displayName || user.username || "Bir kullanıcı",
          storyData?.title || "Bir hikaye",
          storyId,
          content
        ).catch((error) => console.error("Reply notification error:", error));
      }
    }

    // Görev takibi
    if (!parentId) {
      const { challengeActions } = require('../../../store/challengeStore');
      challengeActions.trackAction(user.id, 'commentsPosted').catch(() => {});
    }

    return { success: true, commentId: docRef.id };
  } catch (error) {
    console.error('Add comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Comment creation failed' };
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
    console.error('Update comment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Comment update failed' };
  }
}

export async function deleteComment(storyId: string, commentId: string) {
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
}

export async function likeComment(storyId: string, commentId: string) {
  try {
    const { user } = store.getState().auth;
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
    console.error('Get comment by id error:', error);
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
    store.dispatch(patchStory({ storyComments: visibleComments }));
  } catch (error) {
    console.error('Load comments error:', error);
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

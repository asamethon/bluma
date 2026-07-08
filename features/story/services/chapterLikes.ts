import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { notificationActions } from '../../../store/notificationStore';
import { getStoryById } from './storyApi';

// Bölüm-bazlı beğeni (bkz. YAPILACAKLAR 2.3) — hikâye toplamından ayrı,
// stories/{id}/chapters/{n}/likes/{uid} deterministik dokümanı + chapter
// dokümanındaki likesCount alanı.
function chapterRef(storyId: string, chapterIndex: number) {
  return doc(getFirestore(), 'stories', storyId, 'chapters', String(chapterIndex));
}

export async function isChapterLiked(storyId: string, chapterIndex: number): Promise<boolean> {
  const { user } = store.getState().auth;
  if (!user?.id) return false;
  const snap = await getDoc(doc(collection(chapterRef(storyId, chapterIndex), 'likes'), user.id));
  return snap.exists();
}

export async function toggleChapterLike(storyId: string, chapterIndex: number, wasLiked: boolean) {
  const { user } = store.getState().auth;
  if (!user?.id) return { success: false };

  try {
    const likeRef = doc(collection(chapterRef(storyId, chapterIndex), 'likes'), user.id);
    if (wasLiked) {
      await deleteDoc(likeRef);
      await updateDoc(chapterRef(storyId, chapterIndex), { likesCount: increment(-1) });
    } else {
      await setDoc(likeRef, { userId: user.id, createdAt: serverTimestamp() });
      await updateDoc(chapterRef(storyId, chapterIndex), { likesCount: increment(1) });

      // Yazara "X, N. bölümünü beğendi" bildirimi — kendi hikâyeni beğenmek
      // bildirim üretmez.
      const story = await getStoryById(storyId);
      if (story && story.authorId !== user.id) {
        notificationActions.createNotification({
          userId: story.authorId,
          senderId: user.id,
          type: 'like',
          title: 'Bölüm Beğenildi',
          message: `${user.displayName || user.username || 'Bir kullanıcı'} "${story.title}" hikâyenin ${chapterIndex + 1}. bölümünü beğendi`,
          data: { storyId, chapterIndex: String(chapterIndex) },
          isRead: false,
        }).catch(() => {});
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Toggle chapter like error:', error);
    return { success: false };
  }
}

export const chapterLikesActions = { isChapterLiked, toggleChapterLike };

import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { extractMentions } from '../utils/mentions';
import { createMentionNotification } from '@/features/notifications/services/storyNotifications';
import { store } from '@/store';

export async function notifyMentions(params: {
  storyId: string;
  storyTitle: string;
  commentId: string;
  content: string;
  chapterIndex?: number;
}) {
  try {
    const user = store.getState().auth.user;
    if (!user?.id) return;
    const usernames = extractMentions(params.content);
    if (usernames.length === 0) return;
    const db = getFirestore();
    const unique = Array.from(new Set(usernames)).slice(0, 10);
    const results = await Promise.all(
      unique.map(async (username) => {
        try {
          const snap = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
          if (snap.empty) return null;
          const docSnap = snap.docs[0];
          const userData = docSnap.data() as any;
          const mentionedId = docSnap.id;
          if (!mentionedId || mentionedId === user.id) return null;
          if (userData?.isBlocked || userData?.blocked) return null;
          return mentionedId;
        } catch {
          return null;
        }
      }),
    );
    const mentioned = Array.from(new Set(results.filter((id): id is string => !!id)));
    await Promise.all(
      mentioned.map((mentionedId) =>
        createMentionNotification(
          user.id,
          mentionedId,
          user.displayName || user.username || '',
          params.storyTitle,
          params.storyId,
          params.content,
          params.commentId,
          params.chapterIndex,
        ).catch(() => {}),
      ),
    );
  } catch {
    // ignore
  }
}

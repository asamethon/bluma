import type { Comment } from '@/types';
import { logger } from '@/utils/logger';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { getUserById } from './userCache';

export async function getCommentById(storyId: string, commentId: string): Promise<Comment | null> {
  try {
    const snapshot = await getDoc(doc(getFirestore(), 'stories', storyId, 'comments', commentId));
    if (!snapshot.exists()) return null;
    const comment = { id: snapshot.id, ...snapshot.data() } as Comment;
    const user = await getUserById(comment.userId);
    return {
      ...comment,
      user: user || { id: '', email: '', displayName: '', authProvider: 'email' },
    };
  } catch (error) {
    logger.error('Get comment by id error:', error);
    return null;
  }
}

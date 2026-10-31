import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import i18n from '@/i18n';
import { store } from '@/store';
import { notificationActions } from '@/store/notificationStore';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { addDoc, collection, doc, getDoc, getFirestore, increment, serverTimestamp, updateDoc } from '@react-native-firebase/firestore';
import { applyStoryChange, loadStoriesFeed } from './listeners/storyFeedListeners';
import { forgetStory } from './storyCache';

export async function updateUserStoriesCount(userId: string, delta: number) {
  try {
    await updateDoc(doc(getFirestore(), 'users', userId), { storiesCount: increment(delta) });
  } catch (error) {
    logger.error('Update user stories count error:', error);
  }
}

/** `announce` false: yeniden yayın — takipçilere ikinci kez duyurulmaz. */
export const publishSideEffects = (
  user: NonNullable<ReturnType<typeof store.getState>['auth']['user']>,
  storyId: string,
  title: string,
  announce = true,
) => {
  if (announce) {
    void notificationActions.announceStoryToFollowers(
      user.id,
      user.displayName || user.username || i18n.t('notifications.anAuthorYouFollow'),
      storyId,
      title,
      'new_story',
    );
  }
  void logEvent(getAnalytics(), 'story_publish', { story_id: storyId });
  // Akış artık canlı dinlenmiyor: yazar yeni hikâyesini hemen görsün.
  void loadStoriesFeed({ force: true });
};

export async function createStory(
  storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount' | 'author'>,
) {
  store.dispatch(patchStory({ isLoading: true }));
  try {
    const user = store.getState().auth.user;
    if (!user?.id) throw new Error(i18n.t('errors.loginRequired'));
    const verified = await assertEmailVerified();
    if (!verified.ok) return { success: false, error: verified.error };
    const cleanData = Object.fromEntries(Object.entries(storyData).filter(([, value]) => (
      value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
    )));
    const reference = await addDoc(collection(getFirestore(), 'stories'), {
      language: i18n.language,
      ...cleanData,
      authorId: user.id,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (storyData.isPublished) {
      await updateUserStoriesCount(user.id, 1);
      publishSideEffects(user, reference.id, storyData.title);
    }
    return { success: true, storyId: reference.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : i18n.t('story.createFailed');
    logger.error('Create story error:', error);
    store.dispatch(patchStory({ error: message }));
    return { success: false, error: message };
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}

export async function updateStory(storyId: string, updates: Partial<Story>) {
  try {
    const reference = doc(getFirestore(), 'stories', storyId);
    const snapshot = await getDoc(reference);
    if (!snapshot.exists()) throw new Error(i18n.t('story.notFound'));
    const current = snapshot.data() as Story;
    await updateDoc(reference, { ...updates, updatedAt: serverTimestamp() });
    forgetStory(storyId);
    applyStoryChange(storyId, updates);
    const becamePublished = updates.isPublished === true && !current.isPublished;
    // Yayından kaldırma sayacı geri almazsa her kaldır→yayınla döngüsü
    // profildeki hikâye sayısını bir artırıyordu.
    const becameUnpublished = updates.isPublished === false && current.isPublished;
    if (becamePublished) await updateUserStoriesCount(current.authorId, 1);
    if (becameUnpublished) await updateUserStoriesCount(current.authorId, -1);
    const user = store.getState().auth.user;
    if (user?.id === current.authorId) {
      const title = updates.title || current.title;
      if (becamePublished) publishSideEffects(user, storyId, title, !current.lastNotifiedChapterCount);
    }
    return { success: true };
  } catch (error) {
    logger.error('Update story error:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('story.updateFailed') };
  }
}

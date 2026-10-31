import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import i18n from '@/i18n';
import { store } from '@/store';
import { todayKey } from '@/features/challenges/services/challengeCalendar';
import { challengeActions } from '@/store/challengeStore';
import { notificationActions } from '@/store/notificationStore';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { doc, getDocs, getFirestore, increment, runTransaction, serverTimestamp } from '@react-native-firebase/firestore';
import type { StudioChapter } from '../utils/chapterContent';
import { persistChapterDraft } from './chapterDraftStorage';
import { chapterMetadata, chapterPublication } from './chapterMetadata';
import { chapterCollection, writeChapterSnapshot } from './chapterWrites';
import { applyStoryChange } from './listeners/storyFeedListeners';
import { forgetStory } from './storyCache';
import { publishSideEffects } from './storyMutations';

/**
 * Görevler stüdyo ve içe aktarma için tek yerden: ilk kez yayınlanan hikâye
 * (kaldır→yeniden yayınla tekrar sayılmaz) ve yayın yapılan gün.
 */
function trackPublishChallenges(userId: string, storyId: string,
  result: { firstPublish: boolean; announceStory: boolean; newChapterNumber?: number }) {
  if (result.announceStory) void challengeActions.trackAction(userId, 'storiesPublished', storyId);
  if (result.firstPublish || result.newChapterNumber) {
    void challengeActions.trackAction(userId, 'publishDays', todayKey());
  }
}

/** Yayındaki gövdeler, üstveri ve ilk yayın sayacı tek transaction ile değişir. */
export async function publishChapterDraft(storyId: string, chapters: StudioChapter[]) {
  const user = store.getState().auth.user;
  if (!user) return { success: false, error: i18n.t('studio.publishLoginRequired') };
  try {
    // Yayın başarısız olsa bile yazarın son metni özel taslakta korunur.
    await persistChapterDraft(storyId, chapters);
    if (!chapters.length || chapters.some(chapter => !chapter.content.trim())) {
      return { success: false, error: i18n.t('studio.publishEmptyChapters') };
    }
    const verified = await assertEmailVerified();
    if (!verified.ok) return { success: false, error: verified.error };
    const db = getFirestore();
    const ref = doc(db, 'stories', storyId);
    const chaptersRef = chapterCollection(storyId, 'chapters');
    const existing = await getDocs(chaptersRef);
    const result = await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error(i18n.t('studio.publishStoryMissing'));
      const current = snapshot.data() as Story;
      if (current.authorId !== user.id) throw new Error(i18n.t('studio.publishNotAuthor'));
      const publication = chapterPublication(current, chapters.length);
      const updates = { ...chapterMetadata(chapters), isPublished: true,
        lastNotifiedChapterCount: publication.lastNotifiedChapterCount };
      writeChapterSnapshot(transaction, chaptersRef, chapters, existing);
      transaction.update(ref, { ...updates, updatedAt: serverTimestamp() });
      if (publication.firstPublish) {
        transaction.update(doc(db, 'users', user.id), { storiesCount: increment(1) });
      }
      return { ...publication, updates, title: current.title };
    });
    forgetStory(storyId);
    applyStoryChange(storyId, result.updates);
    if (result.firstPublish) publishSideEffects(user, storyId, result.title, result.announceStory);
    else if (result.newChapterNumber) {
      void notificationActions.announceStoryToFollowers(user.id,
        user.displayName || user.username || i18n.t('notifications.anAuthorYouFollow'),
        storyId, result.title, 'new_chapter', result.newChapterNumber);
    }
    trackPublishChallenges(user.id, storyId, result);
    return { success: true };
  } catch (error) {
    logger.error('Bölüm yayını tamamlanamadı:', error);
    return { success: false, error: error instanceof Error ? error.message : i18n.t('studio.publishError') };
  }
}

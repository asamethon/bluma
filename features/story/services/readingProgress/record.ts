import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { logger } from '@/utils/logger';
import { localKey, type ReadingProgress } from './types';

async function syncToFirestore(uid: string, storyId: string, chapterIndex: number, scrollRatio: number) {
  const db = getFirestore();
  await setDoc(doc(db, 'users', uid, 'readingProgress', storyId), {
    chapterIndex,
    scrollRatio,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveReadingProgress(storyId: string, chapterIndex: number, scrollRatio: number = 0) {
  const { user } = store.getState().auth;
  if (!user?.id) return;

  const payload: ReadingProgress = { storyId, chapterIndex, scrollRatio, updatedAt: Date.now() };
  await AsyncStorage.setItem(localKey(user.id, storyId), JSON.stringify(payload)).catch(() => {});
  syncToFirestore(user.id, storyId, chapterIndex, scrollRatio).catch(() => {
    logger.debug('Reading progress sync to Firestore failed (non-critical, will retry next save)');
  });
}

export async function getReadingProgress(storyId: string): Promise<ReadingProgress | null> {
  const { user } = store.getState().auth;
  if (!user?.id) return null;

  const [local, remote] = await Promise.all([
    AsyncStorage.getItem(localKey(user.id, storyId))
      .then(raw => (raw ? (JSON.parse(raw) as ReadingProgress) : null))
      .catch(() => null),
    getDoc(doc(getFirestore(), 'users', user.id, 'readingProgress', storyId))
      .then(snap => {
        if (!snap.exists()) return null;
        const data = snap.data() as any;
        return {
          storyId,
          chapterIndex: data.chapterIndex || 0,
          scrollRatio: data.scrollRatio || 0,
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0,
        } as ReadingProgress;
      })
      .catch(() => null),
  ]);

  if (local && remote) return local.updatedAt >= remote.updatedAt ? local : remote;
  return local || remote;
}

export async function clearReadingProgressCache(uid: string) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `readingProgress_${uid}_`;
    const toRemove = keys.filter(k => k.startsWith(prefix));
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch (error) {
    logger.error('Clear reading progress cache error:', error);
  }
}

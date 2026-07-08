import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import { Story } from '@/types';

export interface ReadingProgress {
  storyId: string;
  chapterIndex: number;
  scrollRatio: number;
  updatedAt: number;
}

function localKey(uid: string, storyId: string) {
  return `readingProgress_${uid}_${storyId}`;
}

async function syncToFirestore(uid: string, storyId: string, chapterIndex: number, scrollRatio: number) {
  const db = getFirestore();
  await setDoc(doc(db, 'users', uid, 'readingProgress', storyId), {
    chapterIndex,
    scrollRatio,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Offline-first: önce yerel yaz (anında), Firestore'a arkada senkron et.
export async function saveReadingProgress(storyId: string, chapterIndex: number, scrollRatio: number = 0) {
  const { user } = store.getState().auth;
  if (!user?.id) return;

  const payload: ReadingProgress = { storyId, chapterIndex, scrollRatio, updatedAt: Date.now() };
  await AsyncStorage.setItem(localKey(user.id, storyId), JSON.stringify(payload)).catch(() => {});
  syncToFirestore(user.id, storyId, chapterIndex, scrollRatio).catch(() => {
    console.log('Reading progress sync to Firestore failed (non-critical, will retry next save)');
  });
}

// Yerel ve sunucu kaydını karşılaştırıp en güncelini döndürür — ikinci
// cihazda kaldığın yerden devam edebilmek için (bkz. YAPILACAKLAR 2.1).
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

// "Okumaya devam et" rafı — ana sayfadaki yüklü feed'e bağlı değil, kullanıcının
// gerçek ilerleme kayıtlarına bağlı (feed'in 50 hikâyelik sınırını aşar).
export async function loadRecentReadingProgress(limitCount: number = 10): Promise<ReadingProgress[]> {
  const { user } = store.getState().auth;
  if (!user?.id) return [];

  try {
    const q = query(
      collection(getFirestore(), 'users', user.id, 'readingProgress'),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data() as any;
      return {
        storyId: d.id,
        chapterIndex: data.chapterIndex || 0,
        scrollRatio: data.scrollRatio || 0,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0,
      };
    });
  } catch (error) {
    console.error('Load recent reading progress error:', error);
    return [];
  }
}

// "Okumaya devam et" rafını yükleyip store'a yazar — hem ana sayfa hem de
// splash gate (app/_layout.tsx) aynı veriyi okusun diye component state
// yerine burada, redux'ta tutulur (bkz. CLAUDE.md: sunucu verisi state'e
// kopyalanmaz kuralı).
export async function loadContinueReadingShelf(limitCount: number = 5): Promise<void> {
  const { user } = store.getState().auth;
  if (!user?.id) {
    store.dispatch(patchStory({ continueReading: [], continueReadingLoaded: true }));
    return;
  }

  try {
    const { storyActions } = await import('@/store/storyStore');
    const { preferencesActions } = await import('@/store/preferencesStore');
    const { moderationActions } = await import('@/store/moderationStore');

    const progress = await loadRecentReadingProgress(10);
    const items = await Promise.all(
      progress.map(async (p) => {
        const story = await storyActions.getStoryById(p.storyId);
        return story ? { story, chapterIndex: p.chapterIndex } : null;
      })
    );
    const visible = items.filter((x): x is { story: Story; chapterIndex: number } => !!x);
    const visibleStories = preferencesActions.filterMature(
      moderationActions.filterHidden(moderationActions.filterBlocked(visible.map((x) => x.story)))
    );
    const visibleIds = new Set(visibleStories.map((s) => s.id));
    const result = visible.filter((x) => visibleIds.has(x.story.id)).slice(0, limitCount);
    store.dispatch(patchStory({ continueReading: result, continueReadingLoaded: true }));
  } catch (error) {
    console.error('Load continue reading shelf error:', error);
    store.dispatch(patchStory({ continueReading: [], continueReadingLoaded: true }));
  }
}

// Logout'ta çağrılır — bir sonraki kullanıcı önceki kullanıcının ilerleme
// önbelleğini görmesin diye cihazdaki tüm readingProgress_{uid}_* siler.
export async function clearReadingProgressCache(uid: string) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `readingProgress_${uid}_`;
    const toRemove = keys.filter(k => k.startsWith(prefix));
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch (error) {
    console.error('Clear reading progress cache error:', error);
  }
}

export const readingProgressActions = {
  saveReadingProgress,
  getReadingProgress,
  loadRecentReadingProgress,
  loadContinueReadingShelf,
  clearReadingProgressCache,
};

import i18n from '@/i18n';
import { store } from '@/store';
import { rememberDraftSummary, replaceDraftSummaries } from '@/store/slices/storyDraftSlice';
import { doc, getDoc, getDocs, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';
import type { StudioChapter } from '../utils/chapterContent';
import { chapterMetadata, type DraftSummary } from './chapterMetadata';
import { chapterCollection, writeChapterSnapshot } from './chapterWrites';

export async function persistChapterDraft(storyId: string, chapters: StudioChapter[]) {
  const ownerId = store.getState().auth.user?.id;
  if (!ownerId) throw new Error(i18n.t('studio.draftLoginRequired'));
  const ref = chapterCollection(storyId, 'draftChapters');
  const existing = await getDocs(ref);
  const batch = writeBatch(ref.firestore);
  const summary = chapterMetadata(chapters);
  writeChapterSnapshot(batch, ref, chapters, existing);
  batch.set(doc(ref, '_meta'), { ...summary, updatedAt: serverTimestamp() });
  await batch.commit();
  if (store.getState().auth.user?.id === ownerId) {
    store.dispatch(rememberDraftSummary({ ownerId, storyId, summary }));
  }
}

export async function loadChapterDraft(storyId: string): Promise<StudioChapter[] | null> {
  const snapshot = await getDocs(chapterCollection(storyId, 'draftChapters'));
  if (!snapshot.docs.some(item => item.id === '_meta')) return null;
  return snapshot.docs.filter(item => item.id !== '_meta')
    .map(item => ({ id: item.data().sourceId || item.id, ...item.data() } as StudioChapter & { order: number }))
    .sort((first, second) => first.order - second.order)
    .map(({ id, title, content }) => ({ id, title, content }));
}

export async function loadDraftSummaries(ownerId: string, storyIds: string[]) {
  if (store.getState().auth.user?.id !== ownerId) return;
  const entries = await Promise.all(storyIds.map(async storyId => {
    const snapshot = await getDoc(doc(chapterCollection(storyId, 'draftChapters'), '_meta'));
    return [storyId, snapshot.exists() ? snapshot.data() as DraftSummary : null] as const;
  }));
  if (store.getState().auth.user?.id !== ownerId) return;
  store.dispatch(replaceDraftSummaries({ ownerId,
    summaries: Object.fromEntries(entries.filter((entry): entry is readonly [string, DraftSummary] => !!entry[1])),
  }));
}

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
} from '@react-native-firebase/firestore';
import { StudioChapter } from '../utils/chapterContent';

export interface ChapterDoc {
  title: string;
  content: string;
  order: number;
  wordCount: number;
  likesCount?: number;
  sourceId?: string;
}

function chaptersRef(storyId: string) {
  return collection(getFirestore(), 'stories', storyId, 'chapters');
}

export async function getChapter(storyId: string, index: number): Promise<ChapterDoc | null> {
  const snap = await getDoc(doc(chaptersRef(storyId), String(index)));
  return snap.exists() ? (snap.data() as ChapterDoc) : null;
}

export async function loadAllChapters(storyId: string): Promise<StudioChapter[]> {
  const snap = await getDocs(chaptersRef(storyId));
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as ChapterDoc) }))
    .sort((a, b) => a.order - b.order)
    .map(d => ({ id: d.sourceId || d.id, title: d.title, content: d.content }));
}

export const chaptersActions = { getChapter, loadAllChapters };

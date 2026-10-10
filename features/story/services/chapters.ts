import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { StudioChapter } from '../utils/chapterContent';
import { wordCount } from '../utils/textStats';

export interface ChapterDoc {
  title: string;
  content: string;
  order: number;
  wordCount: number;
  likesCount?: number;
}

function chaptersRef(storyId: string) {
  return collection(getFirestore(), 'stories', storyId, 'chapters');
}

async function saveChapters(storyId: string, chapters: StudioChapter[]) {
  const ref = chaptersRef(storyId);
  await Promise.all(
    chapters.map((c, i) =>
      setDoc(doc(ref, String(i)), {
        title: c.title,
        content: c.content,
        order: i,
        wordCount: wordCount(c.content),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    )
  );

  const existing = await getDocs(ref);
  const validIds = new Set(chapters.map((_, i) => String(i)));
  await Promise.all(
    existing.docs.filter(d => !validIds.has(d.id)).map(d => deleteDoc(d.ref))
  );
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
    .map(d => ({ id: d.id, title: d.title, content: d.content }));
}

export const chaptersActions = { saveChapters, getChapter, loadAllChapters };

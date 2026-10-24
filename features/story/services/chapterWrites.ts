import { collection, doc, getFirestore, serverTimestamp,
  type CollectionReference, type DocumentReference, type DocumentData, type SetOptions, type QuerySnapshot } from '@react-native-firebase/firestore';
import type { StudioChapter } from '../utils/chapterContent';
import { wordCount } from '../utils/textStats';

type Writer = {
  set(ref: DocumentReference, data: DocumentData, options: SetOptions): unknown;
  delete(ref: DocumentReference): unknown;
};

export const chapterCollection = (storyId: string, group: 'chapters' | 'draftChapters') =>
  collection(getFirestore(), 'stories', storyId, group);

/** Gövdeler, silmeler ve üstveri aynı atomik yayına eklenebilir. */
export function writeChapterSnapshot(writer: Writer, ref: CollectionReference,
  chapters: StudioChapter[], existing: QuerySnapshot) {
  const validIds = new Set(chapters.map((_, index) => String(index)));
  chapters.forEach((chapter, index) => writer.set(doc(ref, String(index)), {
    sourceId: chapter.id,
    title: chapter.title,
    content: chapter.content,
    order: index,
    wordCount: wordCount(chapter.content),
    updatedAt: serverTimestamp(),
  }, { merge: true }));
  existing.docs.filter(item => item.id !== '_meta' && !validIds.has(item.id))
    .forEach(item => writer.delete(item.ref));
}

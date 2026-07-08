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
  likesCount?: number; // Bölüm-bazlı beğeni sayacı (bkz. YAPILACAKLAR 2.3 / chapterLikes.ts)
}

function chaptersRef(storyId: string) {
  return collection(getFirestore(), 'stories', storyId, 'chapters');
}

// Yazma akışı: bölüm dizisini stories/{id}/chapters/{n} alt koleksiyonuna
// senkron eder. 0..n-1 dışında kalan eski dokümanlar (silinen bölümler)
// yetim kalmasın diye temizlenir. Story dokümanı artık tam içeriği taşımaz —
// yalnızca chapterTitles/chaptersCount metadata'sı (bkz. YAPILACAKLAR 2.2).
export async function saveChapters(storyId: string, chapters: StudioChapter[]) {
  const ref = chaptersRef(storyId);
  // merge:true — aksi halde her otomatik kayıt likesCount gibi yazar
  // dışındaki alanları (bkz. chapterLikes.ts) sıfırlardı.
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

// Okuyucu: tek bir bölümü çeker — sorgu değil tek doküman okuması, önceki
// mimarideki "tüm içeriği indir" maliyetini ortadan kaldırır.
export async function getChapter(storyId: string, index: number): Promise<ChapterDoc | null> {
  const snap = await getDoc(doc(chaptersRef(storyId), String(index)));
  return snap.exists() ? (snap.data() as ChapterDoc) : null;
}

// Yazı Stüdyosu: yazar kendi hikâyesini düzenlerken tüm bölümleri
// StudioChapter dizisine çevirir (yazar-özel akış, maliyet endişesi yok).
export async function loadAllChapters(storyId: string): Promise<StudioChapter[]> {
  const snap = await getDocs(chaptersRef(storyId));
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as ChapterDoc) }))
    .sort((a, b) => a.order - b.order)
    .map(d => ({ id: d.id, title: d.title, content: d.content }));
}

export const chaptersActions = { saveChapters, getChapter, loadAllChapters };

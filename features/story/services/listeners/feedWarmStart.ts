import { publicProfileData } from '@/features/auth/services/profilePrivacy';
import { lookupUserById } from '@/features/auth/services/userCache';
import type { Story, User } from '@/types';
import { doc, getDocFromCache, getDocsFromCache, getFirestore } from '@react-native-firebase/firestore';
import { fallbackAuthor } from './storySnapshot';

/**
 * Sıcak açılış: akışı önce cihazdaki Firestore ön belleğinden göster.
 *
 * Neden: soğuk açılışta akış iki ardışık ağ turunu bekliyordu — önce 50
 * hikâye, sonra o hikâyelerin yazarları (her biri ayrı `getDoc`). İkincisi
 * birincisi bitmeden başlayamadığı için kitaplar ~1-2 sn geç geliyordu.
 * Ön bellekten okuma ağa çıkmaz; sunucu cevabı gelince akış tazesiyle
 * değiştirilir. İlk kurulumda ön bellek boştur ve bu adım sessizce atlanır.
 */
type FeedQuery = Parameters<typeof getDocsFromCache>[0];

async function cachedAuthor(authorId: string): Promise<User | null> {
  try {
    const snapshot = await getDocFromCache(doc(getFirestore(), 'users', authorId));
    if (!snapshot.exists()) return null;
    return { ...publicProfileData(snapshot.data()!), id: authorId } as unknown as User;
  } catch {
    return null;
  }
}

export async function readCachedFeed(source: FeedQuery): Promise<Story[]> {
  try {
    const snapshot = await getDocsFromCache(source);
    if (snapshot.empty) return [];
    const authorIds = [...new Set(snapshot.docs.map(item => (item.data() as Story).authorId).filter(Boolean))];
    const authors = new Map(await Promise.all(authorIds.map(async id => [id, await cachedAuthor(id)] as const)));
    return snapshot.docs.map(item => {
      const data = item.data() as Story;
      return { ...data, id: item.id, author: authors.get(data.authorId) || fallbackAuthor(data.authorId) };
    });
  } catch {
    return [];
  }
}

/**
 * Sunucu sorgusu sürerken yazarları da paralel istet: akış cevabı geldiğinde
 * yazarlar çoğunlukla bellek ön belleğinde hazır olur, ikinci tur beklenmez.
 */
export function prefetchAuthors(stories: Story[]) {
  new Set(stories.map(story => story.authorId).filter(Boolean)).forEach(id => {
    void lookupUserById(id);
  });
}

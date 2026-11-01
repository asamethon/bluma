import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import { Story } from '@/types';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from '@react-native-firebase/firestore';
import { getUserById } from './userCache';

const PAGE_SIZE = 30;

/**
 * Sayfalama imleci havuzdan DEĞİL, akışın kendi sırasından okunur.
 *
 * Havuza akış dışından da hikâye katılıyor (`loadCatalogHighlights` "tüm
 * zamanların en çok okunanlarını" sona ekliyor), bu yüzden havuzun son elemanı
 * da en eski elemanı da `createdAt` sırasında doğru yeri göstermiyor: imleç
 * oradan alındığında sonsuz kuyruk ya aynı sayfayı tekrar çekiyor ya da
 * katalogun ortasını atlayıp "daha yok" diyordu.
 *
 * `rememberFeedCursor` akış her okunduğunda (ve tazelendiğinde) sıfırlanır;
 * her sayfa imleci bir sonraki belgeye taşır.
 */
const cursor = { createdAt: null as unknown };

export function rememberFeedCursor(stories: Story[]) {
  cursor.createdAt = stories.length ? stories[stories.length - 1].createdAt : null;
}

async function loadMoreStories(): Promise<boolean> {
  if (!cursor.createdAt) return false;

  const source = query(
    collection(getFirestore(), 'stories'),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    startAfter(cursor.createdAt),
    limit(PAGE_SIZE),
  );

  const snapshot = await getDocs(source);
  if (snapshot.empty) return false;

  const more: Story[] = await Promise.all(
    snapshot.docs.map(async (storyDoc) => {
      const storyData = storyDoc.data() as Story;
      const author = await getUserById(storyData.authorId);
      return {
        ...storyData,
        id: storyDoc.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      };
    }),
  );

  cursor.createdAt = more[more.length - 1].createdAt;
  const current = store.getState().story.stories;
  const existingIds = new Set(current.map((item) => item.id));
  const fresh = more.filter((item) => !existingIds.has(item.id));
  if (fresh.length > 0) {
    store.dispatch(patchStory({ stories: [...current, ...fresh] }));
  }
  return snapshot.size >= PAGE_SIZE;
}

export const feedPaginationActions = { loadMoreStories };

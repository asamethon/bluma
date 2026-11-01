import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { collection, getDocs, getFirestore, limit, orderBy, query, where } from '@react-native-firebase/firestore';
import { storyFromSnapshot } from './storySnapshot';

/**
 * Ana akış yalnızca EN YENİ 50 hikâyeyi okuyor. 51. hikâye yayınlandığında eski
 * ama çok okunan hikâyeler ana sayfadan tümden düşüyordu — 1 Kasım 2026
 * ölçümünde 88 yayındaki hikâyenin 38'i hiçbir bölüme giremiyordu
 * (bkz. docs/KESFET-ALGORITMASI.md §0.5).
 *
 * Çözüm katalogu indirmek değil: "tüm zamanların" bölümlerini besleyen iki
 * küçük sorgu. Maliyet katalog büyüse de sabit kalır (akış 50 + 2×20 okuma) ve
 * havuz `stories` içinde birleşir; bölümleri `buildHomeSections` zaten sıralıyor.
 */
const CATALOG_SIZE = 20;
const CATALOG_TTL_MS = 30 * 60 * 1000;

const catalog = {
  loadedAt: 0,
  inFlight: null as Promise<void> | null,
};

function topBy(field: 'viewsCount' | 'likesCount') {
  return query(
    collection(getFirestore(), 'stories'),
    where('isPublished', '==', true),
    orderBy(field, 'desc'),
    limit(CATALOG_SIZE),
  );
}

/**
 * Havuza yalnızca akışta olmayanları ekler; mevcut nesneler korunur.
 *
 * Eleme `incoming` İÇİNDE de yapılır: iki sorgu (en çok okunan / en çok
 * beğenilen) aynı hikâyeyi pekâlâ döndürüyor ve yalnız mevcut havuza bakmak
 * onu listeye iki kez sokuyordu — "two children with the same key".
 */
function mergeIntoPool(incoming: Story[]) {
  const current = store.getState().story.stories;
  const known = new Set(current.map(story => story.id));
  const fresh: Story[] = [];
  for (const story of incoming) {
    if (known.has(story.id)) continue;
    known.add(story.id);
    fresh.push(story);
  }
  if (!fresh.length) return;
  store.dispatch(patchStory({ stories: [...current, ...fresh] }));
}

/**
 * Eksik indekste (failed-precondition) sessizce vazgeçer: ana sayfa eski
 * davranışıyla, yalnız en yeni 50 hikâyeyle çalışmaya devam eder.
 */
export function loadCatalogHighlights(options: { force?: boolean } = {}): Promise<void> {
  if (catalog.inFlight) return catalog.inFlight;
  if (!options.force && Date.now() - catalog.loadedAt < CATALOG_TTL_MS) return Promise.resolve();

  catalog.inFlight = Promise.all([getDocs(topBy('viewsCount')), getDocs(topBy('likesCount'))])
    .then(snapshots => Promise.all(snapshots.flatMap(snapshot => snapshot.docs).map(storyFromSnapshot)))
    .then(stories => {
      catalog.loadedAt = Date.now();
      mergeIntoPool(stories);
    })
    .catch(error => {
      // İndeks henüz dağıtılmadıysa bu beklenen bir durum: ana sayfa eski
      // davranışıyla çalışır, kullanıcıya yansımaz. Diğer hatalar gerçek hata.
      const message = String(error?.message ?? error);
      if (message.includes('failed-precondition')) logger.warn('Katalog indeksi henüz yok, akış 50 hikâyeyle devam ediyor.');
      else logger.error('Load catalog highlights error:', error);
    })
    .finally(() => {
      catalog.inFlight = null;
    });
  return catalog.inFlight;
}

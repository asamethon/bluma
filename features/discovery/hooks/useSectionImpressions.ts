import type { ViewToken } from '@shopify/flash-list';
import type { FeedSource } from '../constants';
import { trackSectionImpression } from '../services/feedEvents';

/** Bölüm satırı taşıyan herhangi bir liste öğesi (hikâye satırları `section` taşımaz). */
type ImpressionItem = { kind: string; section?: { key: FeedSource; size: number } };

/**
 * Dikey listede bir bölümün en az yarısı 0,6 sn ekranda kalınca gösterim
 * sayılır. Ayar nesnesi ve geri çağırma modül düzeyinde sabit: FlashList bu
 * iki değerin render'lar arasında değişmesini istemez.
 */
const viewabilityConfig = { itemVisiblePercentThreshold: 50, minimumViewTime: 600 };

function onViewableItemsChanged({ viewableItems }: { viewableItems: ViewToken<ImpressionItem>[] }) {
  for (const { item, index } of viewableItems) {
    if (item?.section && index !== null) {
      trackSectionImpression(item.section.key, index, item.section.size);
    }
  }
}

export function useSectionImpressions() {
  return { viewabilityConfig, onViewableItemsChanged };
}

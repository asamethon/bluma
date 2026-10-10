import type { Conversation, Story } from '@/types';

export type ProfileTab = 'stories' | 'conversations';

/**
 * Profil listesi tek bir FlashList'tir: sekme şeridi de bir satırdır ki
 * `stickyHeaderIndices` ile yukarıda sabitlenebilsin ve kullanıcı listede
 * ilerlerken sekme değiştirmek için başa dönmek zorunda kalmasın.
 */
export type ProfileRow =
  | { key: 'tabs'; kind: 'tabs' }
  | { key: 'composer'; kind: 'composer' }
  | { key: 'empty'; kind: 'empty' }
  | { key: string; kind: 'skeleton' }
  | { key: string; kind: 'story'; story: Story }
  | { key: string; kind: 'conversation'; conversation: Conversation };

type Params = {
  tab: ProfileTab;
  stories: Story[];
  conversations: Conversation[];
  /** Aktif sekmenin verisi hâlâ geliyorsa iskelet satırları gösterilir. */
  loading?: boolean;
  /** Kendi profilimde konuşma sekmesinin başındaki "mesaj yaz" satırı. */
  composer?: boolean;
};

const SKELETON_COUNT = 3;

/** Veri beklenirken gösterilen yer tutucu satırlar. */
export const skeletonRows = (): ProfileRow[] =>
  Array.from({ length: SKELETON_COUNT }, (_, index) => ({ key: `sk-${index}`, kind: 'skeleton' as const }));

export function buildProfileRows({ tab, stories, conversations, loading, composer }: Params): ProfileRow[] {
  const rows: ProfileRow[] = [{ key: 'tabs', kind: 'tabs' }];
  if (composer && tab === 'conversations') rows.push({ key: 'composer', kind: 'composer' });

  if (tab === 'stories') {
    if (stories.length > 0) {
      for (const story of stories) rows.push({ key: `s-${story.id}`, kind: 'story', story });
      return rows;
    }
  } else if (conversations.length > 0) {
    for (const conversation of conversations) {
      rows.push({ key: `c-${conversation.id}`, kind: 'conversation', conversation });
    }
    return rows;
  }

  if (loading) return [...rows, ...skeletonRows()];
  rows.push({ key: 'empty', kind: 'empty' });
  return rows;
}

/** Sekme etiketine bilgi kokusu katan sayaç: sıfırsa sayı gösterilmez. */
export const tabLabel = (label: string, count: number) => (count > 0 ? `${label} · ${count}` : label);

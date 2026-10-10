import type { FeedSource } from '@/features/discovery/constants';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { HomeSection } from '../services/homeSections';
import { HomeContinueSection } from './HomeContinueSection';
import { HomeFeatureSection } from './HomeFeatureSection';
import { HomeStoryListSection } from './HomeStoryListSection';
import { HomeStoryShelf } from './HomeStoryShelf';

const TITLE_KEYS: Partial<Record<FeedSource, string>> = {
  following: 'home.fromFollowing',
  for_you: 'home.forYou',
  popular_now: 'home.popularNow',
  new_arrivals: 'home.newArrivals',
  most_read: 'home.mostRead',
};

/** Ana sayfa listesinin tek satırı: bölümü düzenine göre çizer. */
function HomeSectionViewImpl({ section }: { section: HomeSection }) {
  const { t } = useTranslation();
  if (section.layout === 'continue') return <HomeContinueSection entries={section.entries} />;
  if (section.layout === 'feature') return <HomeFeatureSection story={section.stories[0]} />;

  const title = t(TITLE_KEYS[section.key] || '');
  return section.layout === 'list'
    ? <HomeStoryListSection section={section.key} title={title} stories={section.stories} />
    : <HomeStoryShelf section={section.key} title={title} stories={section.stories} />;
}

export const HomeSectionView = memo(HomeSectionViewImpl);

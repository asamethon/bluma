import { loadDiscoverStories } from './discover/discoverFeed';
import { loadFollowingStories } from './discover/followingFeed';
import { calculatePopularityScore } from './discover/popularity';

export { loadDiscoverStories, loadFollowingStories };

export const discoverActions = {
  loadDiscoverStories,
  loadFollowingStories,
  calculatePopularityScore,
};

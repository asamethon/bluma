import { loadFollowingStories } from './discover/followingFeed';
import { calculatePopularityScore } from './discover/popularity';

export { loadFollowingStories };

export const discoverActions = {
  loadFollowingStories,
  calculatePopularityScore,
};

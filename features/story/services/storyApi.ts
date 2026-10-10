import { deleteStory } from './storyDeletion';
import { createStory, updateStory } from './storyMutations';
import { getStoryById, loadUserStories } from './storyReads';

export { getStoryById } from './storyReads';

export const storyApiActions = {
  createStory,
  deleteStory,
  getStoryById,
  loadUserStories,
  updateStory,
};

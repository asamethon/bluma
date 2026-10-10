import {
  addStory,
  createList,
  deleteList,
  removeStory,
  renameList,
} from '@/features/library/services/readingListMutations';
import { getListStories, isInList, loadLists } from '@/features/library/services/readingListQueries';

export const readingListActions = {
  addStory,
  createList,
  deleteList,
  getListStories,
  isInList,
  loadLists,
  removeStory,
  renameList,
};

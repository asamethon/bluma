import {
  clearReadingProgressCache,
  getReadingProgress,
  saveReadingProgress,
} from './readingProgress/record';
import { loadContinueReadingShelf, loadRecentReadingProgress } from './readingProgress/shelf';

export const readingProgressActions = {
  clearReadingProgressCache,
  getReadingProgress,
  loadContinueReadingShelf,
  loadRecentReadingProgress,
  saveReadingProgress,
};

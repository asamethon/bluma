import type { StudioChapter } from '../utils/chapterContent';
import { persistChapterDraft } from './chapterDraftStorage';
import { publishChapterDraft } from './chapterPublication';
import { queueChapterWrite } from './chapterWriteQueue';
import { deleteStory } from './storyDeletion';

export function saveDraft(storyId: string, chapters: StudioChapter[]) {
  return queueChapterWrite(storyId, () => persistChapterDraft(storyId, chapters));
}

export function publishDraft(storyId: string, chapters: StudioChapter[]) {
  return queueChapterWrite(storyId, () => publishChapterDraft(storyId, chapters));
}

/** Boş bırakılan taslağı siler; süren bir kaydın arkasına sıralanır. */
export function discardDraft(storyId: string) {
  return queueChapterWrite(storyId, () => deleteStory(storyId));
}

import type { StudioChapter } from '../utils/chapterContent';
import { persistChapterDraft } from './chapterDraftStorage';
import { publishChapterDraft } from './chapterPublication';
import { queueChapterWrite } from './chapterWriteQueue';

export function saveDraft(storyId: string, chapters: StudioChapter[]) {
  return queueChapterWrite(storyId, () => persistChapterDraft(storyId, chapters));
}

export function publishDraft(storyId: string, chapters: StudioChapter[]) {
  return queueChapterWrite(storyId, () => publishChapterDraft(storyId, chapters));
}

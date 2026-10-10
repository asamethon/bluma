import { storyActions } from '@/store/storyStore';
import type { Story, StoryCategory } from '@/types';
import { defaultChapterTitle } from '../utils/chapterContent';
import { resolveCoverUrl } from './coverImage';

export type StoryInfoDraft = {
  title: string;
  category: StoryCategory;
  description: string;
  coverImage: string | null;
};

type SaveParams = { storyId?: string; authorId: string; draft: StoryInfoDraft };
type SaveResult = { success: boolean; error?: string; createdStoryId?: string };

const NEW_STORY_DEFAULTS = {
  content: '',
  tags: [] as string[],
  isCompleted: false,
  isPublished: false,
  chaptersCount: 1,
  readingTime: 1,
  isPremium: false,
  isBook: false,
};

/** Yeni hikâye oluşturur ya da mevcut bilgileri günceller. */
export async function saveStoryInfo({ storyId, authorId, draft }: SaveParams): Promise<SaveResult> {
  const title = draft.title.trim();
  const description = draft.description.trim();

  if (storyId) {
    const coverImage = await resolveCoverUrl(draft.coverImage);
    const result = await storyActions.updateStory(storyId, {
      title,
      description,
      category: draft.category,
      ...(coverImage ? { coverImage } : {}),
    });
    return { success: result.success, error: result.error };
  }

  const created = await storyActions.createStory({
    ...NEW_STORY_DEFAULTS,
    title,
    description,
    category: draft.category,
    chapterTitles: [defaultChapterTitle(1)],
    authorId,
  } as Partial<Story> as Story);
  if (!created.success || !created.storyId) return { success: false, error: created.error };

  // Kapak yüklemesi hikâye kaydını bekletmez; başarısızsa hikâye yine de durur.
  const coverImage = await resolveCoverUrl(draft.coverImage);
  if (coverImage) await storyActions.updateStory(created.storyId, { coverImage });
  return { success: true, createdStoryId: created.storyId };
}

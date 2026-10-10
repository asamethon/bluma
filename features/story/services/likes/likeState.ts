import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';

const withDelta = (stories: Story[], storyId: string, delta: number) =>
  stories.map(story =>
    story.id === storyId ? { ...story, likesCount: Math.max(0, (story.likesCount ?? 0) + delta) } : story,
  );

/** Aynı hikâyenin akıştaki tüm kopyalarında beğeni sayacını oynatır. */
export function applyLikeDelta(storyId: string, delta: number) {
  const { stories, discoverStories, followingStories, currentStory } = store.getState().story;
  store.dispatch(
    patchStory({
      stories: withDelta(stories, storyId, delta),
      discoverStories: withDelta(discoverStories, storyId, delta),
      followingStories: withDelta(followingStories, storyId, delta),
      ...(currentStory?.id === storyId
        ? { currentStory: withDelta([currentStory], storyId, delta)[0] }
        : {}),
    }),
  );
}

function findLoadedStory(storyId: string): Story | undefined {
  const { stories, discoverStories, followingStories, currentStory } = store.getState().story;
  const match = (list: Story[]) => list.find(story => story.id === storyId);
  return (
    match(stories) ??
    match(discoverStories) ??
    match(followingStories) ??
    (currentStory?.id === storyId ? currentStory : undefined)
  );
}

/** Favoriler listesini iyimser olarak günceller. */
export function setLikedOptimistically(storyId: string, liked: boolean) {
  const { likedStories } = store.getState().story;
  if (!liked) {
    store.dispatch(patchStory({ likedStories: likedStories.filter(story => story.id !== storyId) }));
    return;
  }
  if (likedStories.some(story => story.id === storyId)) return;
  const story = findLoadedStory(storyId);
  if (!story) return;
  store.dispatch(
    patchStory({ likedStories: [{ ...story, likesCount: (story.likesCount ?? 0) + 1 }, ...likedStories] }),
  );
}

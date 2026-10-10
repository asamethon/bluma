import { Story } from '@/types';

interface TasteProfile {
  categoryWeights: Record<string, number>;
  tagWeights: Record<string, number>;
  authorWeights: Record<string, number>;
  excludedIds: Set<string>;
  ownAuthorId?: string;
}

export interface TasteSignals {
  likedStories: Story[];
  readingStories: Story[];
  interests: string[];
  userId?: string;
}

const LIKE_WEIGHT = 3;
const READING_WEIGHT = 2;
const INTEREST_WEIGHT = 1.5;

function buildTasteProfile(signals: TasteSignals): TasteProfile {
  const categoryWeights: Record<string, number> = {};
  const tagWeights: Record<string, number> = {};
  const authorWeights: Record<string, number> = {};
  const excludedIds = new Set<string>();

  const absorb = (story: Story, weight: number) => {
    if (story.category) {
      categoryWeights[story.category] = (categoryWeights[story.category] || 0) + weight;
    }
    for (const tag of story.tags || []) {
      const key = tag.trim().toLowerCase();
      if (key) tagWeights[key] = (tagWeights[key] || 0) + weight;
    }
    if (story.authorId) {
      authorWeights[story.authorId] = (authorWeights[story.authorId] || 0) + weight;
    }
  };

  for (const story of signals.likedStories) {
    absorb(story, LIKE_WEIGHT);
    excludedIds.add(story.id);
  }
  for (const story of signals.readingStories) {
    absorb(story, READING_WEIGHT);
    excludedIds.add(story.id);
  }
  for (const interest of signals.interests) {
    categoryWeights[interest] = (categoryWeights[interest] || 0) + INTEREST_WEIGHT;
  }

  return { categoryWeights, tagWeights, authorWeights, excludedIds, ownAuthorId: signals.userId };
}

function hasSignals(profile: TasteProfile): boolean {
  return (
    Object.keys(profile.categoryWeights).length > 0 ||
    Object.keys(profile.tagWeights).length > 0 ||
    Object.keys(profile.authorWeights).length > 0
  );
}

function scoreStory(story: Story, profile: TasteProfile, appLanguage: string): number {
  if (story.authorId === profile.ownAuthorId) return 0;
  if (profile.excludedIds.has(story.id)) return 0;

  const categoryScore = (profile.categoryWeights[story.category] || 0) * 2;
  const tagScore = (story.tags ?? []).reduce(
    (total, tag) => total + (profile.tagWeights[tag.trim().toLowerCase()] || 0),
    0,
  );
  const authorScore = (profile.authorWeights[story.authorId] || 0) * 1.5;

  const affinity = categoryScore + tagScore + authorScore;
  if (affinity <= 0) return 0;

  const engagement =
    (story.likesCount || 0) * 3 + (story.commentsCount || 0) * 5 + (story.viewsCount || 0) * 0.1;
  const popularity = Math.log10(1 + engagement);

  const languageFactor = !story.language
    ? 1.0
    : matchesLanguage(story.language, appLanguage)
      ? 1.3
      : 0.5;

  return (affinity + popularity) * languageFactor;
}

function matchesLanguage(storyLang: string, appLang: string): boolean {
  const base = (l: string) => l.toLowerCase().split('-')[0];
  return base(storyLang) === base(appLang);
}

export function getRecommendations(
  candidates: Story[],
  signals: TasteSignals,
  appLanguage: string,
  limit = 12
): Story[] {
  const profile = buildTasteProfile(signals);
  if (!hasSignals(profile)) return [];

  return candidates
    .map(story => ({ story, score: scoreStory(story, profile, appLanguage) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.story);
}

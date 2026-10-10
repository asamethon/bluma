import type { Story } from '@/types';

export function calculatePopularityScore(story: Story): number {
  const now = new Date();
  const storyDate = story.createdAt && typeof story.createdAt === 'object' && 'toDate' in story.createdAt
    ? (story.createdAt as any).toDate()
    : new Date(story.createdAt || 0);

  const ageInDays = Math.max(1, (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60 * 24));

  const likesScore = (story.likesCount || 0) * 3;
  const commentsScore = (story.commentsCount || 0) * 5;
  const viewsScore = (story.viewsCount || 0) * 0.1;

  const timeWeight = Math.max(0.1, 1 / Math.sqrt(ageInDays));

  const premiumBonus = story.isPremium ? 1.2 : 1.0;
  const completedBonus = story.isCompleted ? 1.1 : 1.0;

  const totalScore = (likesScore + commentsScore + viewsScore) * timeWeight * premiumBonus * completedBonus;

  return totalScore;
}

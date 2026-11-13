/** Kutlama kartında gösterilen topluluk sayıları (admin script'i yazar). */
export type MilestoneStats = {
  stories: number;
  writers: number;
  reads: number;
  comments: number;
};

/** `milestones/{id}` belgesi: yalnızca `scripts/milestone-1k.cjs` yazar. */
export type Milestone = {
  id: string;
  active: boolean;
  members: number;
  stats: MilestoneStats;
  /** Kartın kendiliğinden açılmayı bıraktığı an (ms); 0 = süresiz. */
  endsAt: number;
};

export type MilestoneTarget = 'instagramStory' | 'message';

/** Instagram Story tuvali (lansman kartıyla aynı 9:19.5 oran). */
export const MILESTONE_SIZE = { width: 1080, height: 2340 } as const;

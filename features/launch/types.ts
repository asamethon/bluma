export type LaunchFormat = 'story' | 'post';
export type LaunchTarget = 'instagramStory' | 'instagramPost' | 'message';

export const LAUNCH_SIZE: Record<LaunchFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 2340 },
  post: { width: 1080, height: 1350 },
};

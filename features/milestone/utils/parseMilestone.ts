import { toMillis } from '@/utils/time';
import type { Milestone } from '../types';

const count = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0;

/** Firestore belgesini güvenli tipe çevirir; bozuk alanlar 0'a düşer. */
export function parseMilestone(id: string, data?: Record<string, unknown> | null): Milestone | null {
  if (!data) return null;
  const stats = (data.stats ?? {}) as Record<string, unknown>;
  return {
    id,
    active: data.active === true,
    members: count(data.members),
    stats: {
      stories: count(stats.stories),
      writers: count(stats.writers),
      reads: count(stats.reads),
      comments: count(stats.comments),
    },
    endsAt: toMillis(data.endsAt),
  };
}

/** Kart yalnızca bayrak açıkken ve süresi dolmamışken kendiliğinden açılır. */
export function isMilestoneLive(milestone: Milestone | null, now: number): boolean {
  if (!milestone?.active) return false;
  return milestone.endsAt === 0 || now < milestone.endsAt;
}

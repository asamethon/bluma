import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import type { UsernameFlagReason } from '../utils/usernameAssess';

/**
 * Kullanıcı adı önerisi hunisi. Hepsi fire-and-forget: ölçüm akışı bloklamaz
 * (bkz. features/discovery/services/feedEvents.ts aynı kalıp).
 */
const shown = new Set<string>();

const track = (name: string, reason: UsernameFlagReason) => {
  logEvent(getAnalytics(), name, { reason }).catch(() => {});
};

/** Kart göründü: uygulama oturumu başına gerekçe başına bir kez. */
export function trackNudgeShown(reason: UsernameFlagReason) {
  if (shown.has(reason)) return;
  shown.add(reason);
  track('username_nudge_shown', reason);
}

/** Kullanıcı "Böyle kalsın" dedi. */
export function trackNudgeDismissed(reason: UsernameFlagReason) {
  track('username_nudge_dismissed', reason);
}

/**
 * Kullanıcı adı gerçekten değişti ve ESKİ ad işaretlenmiş olanlardandı.
 * Giriş noktasından bağımsız ölçülür; önemli olan sonuç.
 */
export function trackNudgeChanged(reason: UsernameFlagReason) {
  track('username_nudge_changed', reason);
}

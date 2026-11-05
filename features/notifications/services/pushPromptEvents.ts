import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import type { PushPermission } from '@/types';

/**
 * Bildirim izni hunisi: kart/şerit göründü → kullanıcı kabul etti → sistem
 * izni verildi. Hepsi fire-and-forget; ölçüm akışı bloklamaz.
 */
type Source = 'follow' | 'comment' | 'banner';

const track = (name: string, params: Record<string, string>) => {
  logEvent(getAnalytics(), name, params).catch(() => {});
};

const shownBanners = new Set<string>();

export function trackPromptShown(source: Source, permission: PushPermission) {
  if (source === 'banner') {
    // Şerit her render'da görünür; oturum başına bir kez sayılır.
    if (shownBanners.has(permission)) return;
    shownBanners.add(permission);
  }
  track('push_prompt_shown', { source, permission });
}

export function trackPromptAnswer(source: Source, accepted: boolean) {
  track(accepted ? 'push_prompt_accepted' : 'push_prompt_declined', { source });
}

export function trackPermissionResult(source: Source, granted: boolean) {
  track('push_permission_result', { source, granted: granted ? 'yes' : 'no' });
}

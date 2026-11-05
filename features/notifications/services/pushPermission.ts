import { isLocalFirebase } from '@/constants/firebaseEnvironment';
import { pushNotificationService } from '@/services/pushNotificationService';
import { store } from '@/store';
import { patchNotification } from '@/store/slices/notificationSlice';
import type { PushPermission, PushPromptReason } from '@/types';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { BANNER_SNOOZE_MS, canOfferPrompt, toPushPermission } from '../utils/pushPermissionRules';
import { trackPermissionResult, trackPromptAnswer, trackPromptShown } from './pushPromptEvents';
import { readPromptRecord, writePromptRecord } from './pushPromptStorage';

/** Takip/yorum butonunun kendi geri bildirimi görünsün, kart ardından gelsin. */
const PROMPT_DELAY_MS = 700;

const currentUserId = () => {
  const { user, isGuest } = store.getState().auth;
  return !isGuest && user?.id ? user.id : null;
};

async function readPermission(): Promise<PushPermission> {
  if (isLocalFirebase || !Device.isDevice) return 'unsupported';
  try {
    return toPushPermission(await Notifications.getPermissionsAsync());
  } catch {
    return 'unsupported';
  }
}

/**
 * İzni yeniden okur. `registerOnGrant`: kullanıcı izni telefonun Ayarlar'ından
 * açıp döndüyse token o an kaydedilir; yoksa push ancak bir sonraki oturumda
 * çalışırdı.
 */
export async function refreshPushPermission(options: { registerOnGrant?: boolean } = {}) {
  const previous = store.getState().notification.pushPermission;
  const next = await readPermission();
  if (next !== previous) store.dispatch(patchNotification({ pushPermission: next }));
  const userId = currentUserId();
  if (options.registerOnGrant && userId && next === 'granted' && previous && previous !== 'granted') {
    void pushNotificationService.saveUserPushToken(userId);
  }
  return next;
}

/** Değer anı (takip, yorum): kurallar izin veriyorsa yumuşak kartı açar. */
export async function offerPushPrompt(reason: PushPromptReason) {
  const userId = currentUserId();
  if (!userId || store.getState().notification.pushPrompt) return;
  const permission = await refreshPushPermission();
  const record = await readPromptRecord(userId);
  const now = Date.now();
  if (!canOfferPrompt(record, permission, now)) return;

  await writePromptRecord(userId, { ...record, shows: record.shows + 1, lastShownAt: now });
  trackPromptShown(reason, permission);
  setTimeout(() => {
    if (store.getState().notification.pushPrompt) return;
    store.dispatch(patchNotification({ pushPrompt: { reason, open: true, accepted: false } }));
  }, PROMPT_DELAY_MS);
}

/** Kart kapanmaya başlar; kabul edildiyse istek kapanış bitince yapılır. */
export function answerPushPrompt(accepted: boolean) {
  const prompt = store.getState().notification.pushPrompt;
  if (!prompt?.open) return;
  trackPromptAnswer(prompt.reason, accepted);
  store.dispatch(patchNotification({ pushPrompt: { ...prompt, open: false, accepted } }));
}

/** Kart TAMAMEN kapandı (bkz. Sheet.onClosed): sistem penceresi artık açılabilir. */
export function finishPushPrompt() {
  const prompt = store.getState().notification.pushPrompt;
  store.dispatch(patchNotification({ pushPrompt: null }));
  if (prompt?.accepted) void requestPushPermission(prompt.reason);
}

/**
 * Sorulabiliyorsa sistem penceresini açar ve token'ı kaydeder; iOS'ta bir kez
 * reddedilmişse doğrudan Ayarlar'daki Bluma sayfasına götürür.
 */
export async function requestPushPermission(source: PushPromptReason | 'banner') {
  const userId = currentUserId();
  if (!userId) return;
  const permission = await refreshPushPermission();
  if (permission === 'blocked') {
    await Linking.openSettings().catch(() => {});
    return;
  }
  if (permission !== 'askable') return;
  const granted = await pushNotificationService.saveUserPushToken(userId, { prompt: true });
  trackPermissionResult(source, granted);
  await refreshPushPermission();
}

export async function snoozePushBanner(userId: string) {
  const record = await readPromptRecord(userId);
  await writePromptRecord(userId, { ...record, bannerUntil: Date.now() + BANNER_SNOOZE_MS });
}


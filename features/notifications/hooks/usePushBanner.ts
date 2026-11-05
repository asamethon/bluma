import { useAppSelector } from '@/store/hooks';
import { useCallback, useEffect, useState } from 'react';
import { requestPushPermission, snoozePushBanner } from '../services/pushPermission';
import { trackPromptAnswer, trackPromptShown } from '../services/pushPromptEvents';
import { readPromptRecord } from '../services/pushPromptStorage';
import {
  BANNER_SNOOZE_MS,
  EMPTY_PROMPT_RECORD,
  canShowBanner,
  type PushPromptRecord,
} from '../utils/pushPermissionRules';

/**
 * "Bildirimler kapalı" şeridinin durumu. `snoozable`: ana sayfada "Şimdi
 * değil" ile bir hafta gizlenir; bildirimler ekranında ise izin kapalı
 * olduğu sürece hep görünür (orada tam yerinde).
 *
 * `record` üç durumlu: `null` = yerel karar henüz okunmadı, şerit o sırada
 * gösterilmez (açılışta bir an görünüp kaybolmasın).
 */
export function usePushBanner(snoozable: boolean) {
  const userId = useAppSelector(state => (state.auth.isGuest ? undefined : state.auth.user?.id));
  const permission = useAppSelector(state => state.notification.pushPermission);
  const [record, setRecord] = useState<PushPromptRecord | null>(null);

  useEffect(() => {
    if (!userId || !snoozable) return;
    const lifecycle = { cancelled: false };
    void readPromptRecord(userId).then(value => {
      if (!lifecycle.cancelled) setRecord(value);
    });
    return () => { lifecycle.cancelled = true; };
  }, [snoozable, userId]);

  const effective = snoozable ? record : EMPTY_PROMPT_RECORD;
  const visible = !!userId && !!effective && canShowBanner(effective, permission, Date.now());

  // Gösterim ölçümü; olay servisi oturum başına bir kez gönderiyor.
  useEffect(() => {
    if (visible && permission) trackPromptShown('banner', permission);
  }, [permission, visible]);

  const enable = useCallback(() => {
    trackPromptAnswer('banner', true);
    void requestPushPermission('banner');
  }, []);

  const dismiss = useCallback(() => {
    if (!userId) return;
    // Optimistic: şerit anında kapanır, kayıt arka planda.
    setRecord(current => ({ ...(current ?? EMPTY_PROMPT_RECORD), bannerUntil: Date.now() + BANNER_SNOOZE_MS }));
    trackPromptAnswer('banner', false);
    void snoozePushBanner(userId);
  }, [userId]);

  return { visible, blocked: permission === 'blocked', enable, dismiss: snoozable ? dismiss : undefined };
}

import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { buildProfileShareUrl } from '@/utils/deepLinks';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';
import { loadMilestone } from '../services/milestoneApi';
import { shareMilestone } from '../services/shareMilestone';
import { MILESTONE_SIZE, type MilestoneTarget } from '../types';

/** Kutlama ekranının durumu: belge, ekran dışı kart referansı, paylaşım. */
export function useMilestoneCard() {
  const artworkRef = useRef<ViewShotRef>(null);
  const [sharing, setSharing] = useState<MilestoneTarget | null>(null);
  const milestone = useAppSelector(s => s.milestone.current);
  const loaded = useAppSelector(s => s.milestone.loaded);
  const userId = useAppSelector(s => s.auth.user?.id);

  // Rozetten doğrudan girildiğinde belge henüz okunmamış olabilir; okuma
  // başarısız olsa da bekleme biter (sonsuz spinner yok).
  const [settled, setSettled] = useState(loaded);
  useEffect(() => {
    const run = { alive: true };
    void loadMilestone().finally(() => { if (run.alive) setSettled(true); });
    return () => { run.alive = false; };
  }, []);

  const share = useCallback(async (target: MilestoneTarget) => {
    if (!artworkRef.current || !userId || sharing) return;
    setSharing(target);
    try {
      const imageUri = await captureRef(artworkRef, { format: 'png', result: 'tmpfile', ...MILESTONE_SIZE });
      await shareMilestone({ target, imageUri, link: buildProfileShareUrl(userId) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) {
        logger.error('1K kartı paylaşılamadı', error);
        Alert.alert(i18n.t('launch.shareFailedTitle'), i18n.t('launch.shareFailedMessage'));
      }
    } finally {
      setSharing(null);
    }
  }, [sharing, userId]);

  return { artworkRef, milestone, loading: !settled && !loaded, share, sharing };
}

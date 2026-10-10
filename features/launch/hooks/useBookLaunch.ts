import type { Story } from '@/types';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';
import { shareLaunch } from '../services/shareLaunch';
import { LAUNCH_SIZE, type LaunchFormat, type LaunchTarget } from '../types';

export function useBookLaunch(story: Story | null) {
  const artworkRef = useRef<ViewShotRef>(null);
  const [format, setFormat] = useState<LaunchFormat>('story');
  const [sharing, setSharing] = useState<LaunchTarget | null>(null);
  const [coverReady, setCoverReady] = useState(false);
  const artworkReady = !story?.coverImage || coverReady;
  const markCoverReady = useCallback(() => setCoverReady(true), []);

  const share = useCallback(async (target: LaunchTarget) => {
    if (!story || !artworkRef.current || !artworkReady || sharing) return;
    const selectedFormat: LaunchFormat = target === 'instagramPost'
      ? 'post'
      : target === 'instagramStory' ? 'story' : format;
    setFormat(selectedFormat);
    setSharing(target);

    try {
      // Format değişiminin paylaşım kartına çizilmesini bekle: ilk kare yeni
      // genişliği ölçer, ikincisi o ölçeğe göre yeniden çizilmiş halini verir.
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const size = LAUNCH_SIZE[selectedFormat];
      const imageUri = await captureRef(artworkRef, {
        format: 'png',
        result: 'tmpfile',
        width: size.width,
        height: size.height,
      });
      await shareLaunch({ target, imageUri, storyId: story.id, title: story.title });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel|dismiss/i.test(message)) {
        logger.error('Book launch share error', error);
        Alert.alert(i18n.t('launch.shareFailedTitle'), i18n.t('launch.shareFailedMessage'));
      }
    } finally {
      setSharing(null);
    }
  }, [artworkReady, format, sharing, story]);

  return { artworkRef, artworkReady, format, setFormat, markCoverReady, share, sharing };
}

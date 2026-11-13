import i18n from '@/i18n';
import { META_APP_ID } from '@/constants/config';
import { shareToInstagramStory } from '@/modules/bluma-instagram-share';
import { logger } from '@/utils/logger';
import { Clipboard, Platform, Share as SystemShare } from 'react-native';
import Share, { Social } from 'react-native-share';
import type { MilestoneTarget } from '../types';

const STORY_COLORS = { topColor: '#2A1B52', bottomColor: '#7057D9' } as const;

const fileUrl = (uri: string) => (uri.startsWith('file://') ? uri : `file://${uri}`);

/**
 * Lansman paylaşımıyla aynı yol (features/launch/services/shareLaunch.ts):
 * Story düzenleyicisi doğrudan açılır, bağlantı panoya bırakılır; Instagram
 * açılamazsa sistem paylaşım sayfasına düşülür.
 */
export async function shareMilestone({ target, imageUri, link }: {
  target: MilestoneTarget;
  imageUri: string;
  link: string;
}) {
  const message = i18n.t('milestone.shareMessage', { url: link });
  if (Platform.OS === 'web') {
    await SystemShare.share({ message });
    return;
  }
  const image = fileUrl(imageUri);
  if (target === 'instagramStory' && META_APP_ID) {
    try {
      Clipboard.setString(link);
    } catch {
      // Pano erişilemezse paylaşım yine de sürer.
    }
    if (await openInstagramStory(image, link)) return;
  }
  await Share.open({
    title: 'Bluma 1K',
    subject: 'Bluma 1K',
    message,
    url: image,
    type: 'image/png',
    failOnCancel: false,
    useInternalStorage: true,
  });
}

async function openInstagramStory(image: string, link: string): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      return await shareToInstagramStory({ imageUri: image, link, appId: META_APP_ID, ...STORY_COLORS });
    }
    await Share.shareSingle({
      social: Social.InstagramStories,
      appId: META_APP_ID,
      backgroundImage: image,
      attributionURL: link,
      backgroundTopColor: STORY_COLORS.topColor,
      backgroundBottomColor: STORY_COLORS.bottomColor,
    });
    return true;
  } catch (error) {
    logger.warn('Instagram Story açılamadı (1K kartı)', error);
    return false;
  }
}

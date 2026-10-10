import { buildStoryShareUrl } from '@/utils/deepLinks';
import i18n from '@/i18n';
import { META_APP_ID } from '@/constants/config';
import { shareToInstagramFeed, shareToInstagramStory } from '@/modules/bluma-instagram-share';
import { logger } from '@/utils/logger';
import { Clipboard, Platform, Share as SystemShare } from 'react-native';
import Share, { Social } from 'react-native-share';
import type { LaunchTarget } from '../types';

type Params = {
  target: LaunchTarget;
  imageUri: string;
  storyId: string;
  title: string;
};

type Payload = { target: LaunchTarget; image: string; url: string; message: string };

const STORY_COLORS = { topColor: '#2A1B52', bottomColor: '#7057D9' } as const;

const fileUrl = (uri: string) => uri.startsWith('file://') ? uri : `file://${uri}`;

// Instagram, uygulamaların hikâyeye tıklanabilir bağlantı etiketi koymasına izin
// vermiyor; bağlantıyı panoya bırakıp kullanıcının "Bağlantı" etiketine
// yapıştırmasını sağlıyoruz. iOS Story akışı panoyu kendi öğesiyle değiştirdiği
// için bağlantıyı o öğeye native modül yazıyor (modules/bluma-instagram-share).
export async function shareLaunch({ target, imageUri, storyId, title }: Params) {
  const url = buildStoryShareUrl(storyId);
  const message = i18n.t('launch.shareMessage', { title, url });

  if (Platform.OS === 'web') {
    await SystemShare.share({ title: `${title} • Bluma`, message });
    return;
  }

  const payload: Payload = { target, image: fileUrl(imageUri), url, message };

  if (target !== 'message') {
    copyLink(url);
    const opened = Platform.OS === 'ios' ? await openOnIos(payload) : await openOnAndroid(payload);
    if (opened) return;
  }

  // Mesaj ve Instagram'ın açılamadığı durumlar: sistem paylaşım sayfası.
  await Share.open({
    title: `${title} • Bluma`,
    subject: `${title} • Bluma`,
    message,
    url: payload.image,
    type: 'image/png',
    failOnCancel: false,
    useInternalStorage: true,
  });
}

function copyLink(url: string) {
  try {
    Clipboard.setString(url);
  } catch {
    // Pano erişilemezse paylaşımı yine de sürdür.
  }
}

// iOS: Story düzenleyicisi ya da gönderi akışı doğrudan açılır. Instagram yoksa,
// izin verilmezse veya modül derlemede yoksa false → sistem sayfası.
async function openOnIos({ target, image, url }: Payload): Promise<boolean> {
  try {
    if (target === 'instagramStory') {
      if (!META_APP_ID) return false;
      return await shareToInstagramStory({ imageUri: image, link: url, appId: META_APP_ID, ...STORY_COLORS });
    }
    return await shareToInstagramFeed(image);
  } catch (error) {
    logger.warn('Instagram doğrudan paylaşım açılamadı', error);
    return false;
  }
}

// Android: görsel intent ile taşındığından pano korunur.
async function openOnAndroid({ target, image, url, message }: Payload): Promise<boolean> {
  if (target === 'instagramStory' && META_APP_ID) {
    await Share.shareSingle({
      social: Social.InstagramStories,
      appId: META_APP_ID,
      backgroundImage: image,
      // Instagram bugün yok sayıyor; desteklerse bağlantı hazır gelsin diye duruyor.
      attributionURL: url,
      linkUrl: url,
      linkText: "Bluma'da oku",
      backgroundTopColor: STORY_COLORS.topColor,
      backgroundBottomColor: STORY_COLORS.bottomColor,
    });
    return true;
  }
  // Instagram'ın kendi seçicisi (Hikâye / Gönderi) doğru görselle açılır.
  await Share.shareSingle({
    social: Social.Instagram,
    url: image,
    type: 'image/png',
    message,
    forceDialog: true,
    useInternalStorage: true,
  });
  return true;
}

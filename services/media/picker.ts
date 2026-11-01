import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import * as ImagePicker from 'expo-image-picker';
import { VIDEO_MAX_SECONDS } from './limits';

/** Sınır kontrolü için süre ve boyut da gerekir, yalnızca adres değil. */
export type PickedMedia = { uri: string; duration?: number | null; fileSize?: number | null };

// İzin hatası kullanıcıya olduğu gibi gösterilmeli; bu yüzden seçim
// hatalarını saran try/catch'in DIŞINDA fırlatılır.
async function pick(
  options: ImagePicker.ImagePickerOptions,
  errorKey: string,
): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(i18n.t('imageUpload.galleryPermission'));

  try {
    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    if (!asset?.uri) throw new Error('Picker returned no asset');
    return { uri: asset.uri, duration: asset.duration, fileSize: asset.fileSize };
  } catch (error) {
    logger.error('Media pick error:', error);
    throw new Error(i18n.t(errorKey));
  }
}

/**
 * Video. `Medium` kalite bilinçli: iOS kaydı 540p civarına indirir, böylece
 * 20 sn'lik klip mobil veriyle birkaç MB olarak yüklenir ve sunucunun 50 MB
 * sınırına takılmaz. Sunucu zaten yeniden kodluyor, kaynağı büyütmüyor.
 */
export const pickStoryVideo = () => pick({
  mediaTypes: ['videos'],
  allowsEditing: false,
  videoMaxDuration: VIDEO_MAX_SECONDS,
  videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
}, 'mediaUpload.videoPickError');

/**
 * GIF. `allowsEditing` ve sıkıştırma KAPALI olmak zorunda: ikisi de iOS'ta
 * GIF'i tek kareli PNG/JPEG'e çevirir ve animasyon kaybolur
 * (bkz. expo-image-picker ImageUtils.swift → processGifData).
 */
export const pickStoryGif = () => pick({
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1,
}, 'mediaUpload.gifPickError');

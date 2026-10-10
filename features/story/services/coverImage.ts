import i18n from '@/i18n';
import { imageUploadService } from '@/services/imageUploadService';
import { Alert } from 'react-native';

/** Kapak seçimi; izin/seçim hatası kullanıcıya olduğu gibi gösterilir. */
export async function pickCoverImage(source: 'gallery' | 'camera'): Promise<string | null> {
  try {
    return source === 'camera'
      ? await imageUploadService.takePhotoWithCamera()
      : await imageUploadService.pickImageFromGallery();
  } catch (error) {
    const fallback = source === 'camera' ? 'imageUpload.captureError' : 'imageUpload.pickError';
    Alert.alert(i18n.t('common.error'), error instanceof Error ? error.message : i18n.t(fallback));
    return null;
  }
}

/**
 * Yerel dosyayı görsel sunucusuna yükler; zaten uzak adresse olduğu gibi döner.
 * Hata sessizce yutulmaz: kapak eklenmediyse kullanıcı sebebini görmeli
 * (moderasyon reddi dahil). Hikâye kaydı yine de sürer, kapaksız devam eder.
 */
export async function resolveCoverUrl(coverImage: string | null): Promise<string | undefined> {
  if (!coverImage) return undefined;
  if (coverImage.startsWith('http')) return coverImage;
  try {
    return await imageUploadService.uploadBookCover(coverImage);
  } catch (error) {
    const reason = error instanceof Error ? error.message : i18n.t('imageUpload.coverError');
    Alert.alert(i18n.t('common.error'), `${reason}\n\n${i18n.t('imageUpload.coverRetryHint')}`);
    return undefined;
  }
}

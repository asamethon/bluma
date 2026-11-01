import i18n from '@/i18n';
import { gifSearchEnabled } from '@/services/gif/klipy';
import { imageUploadService } from '@/services/imageUploadService';
import {
  checkGifAsset,
  checkVideoAsset,
  mediaRejectionKey,
  VIDEO_MAX_SECONDS,
  type MediaRejection,
} from '@/services/media/limits';
import { pickStoryGif, pickStoryVideo, type PickedMedia } from '@/services/media/picker';
import { uploadStoryGif, uploadStoryVideo } from '@/services/media/upload';
import { useState } from 'react';
import { Alert } from 'react-native';
import { buildImageToken, buildVideoToken } from '../utils/mediaToken';

/** Açık panel: kaynak seçimi mi, hazır GIF araması mı. */
type Panel = 'none' | 'source' | 'gifSearch';

const noCheck = () => null;

/**
 * Bölüm metnine görsel/GIF/video ekler. Üç yol da aynı sırayı izler:
 * seç → sınırları kontrol et → yükle (moderasyon sunucuda) → token'ı metne yaz.
 */
export function useMediaInsert(insertSnippet: (snippet: string) => void) {
  const [panel, setPanel] = useState<Panel>('none');
  const [uploading, setUploading] = useState(false);

  const run = async (
    pick: () => Promise<PickedMedia | null>,
    check: (asset: PickedMedia) => MediaRejection | null,
    upload: (uri: string) => Promise<string>,
    errorKey: string,
  ) => {
    try {
      const asset = await pick();
      if (!asset) return;
      const rejection = check(asset);
      if (rejection) {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t(mediaRejectionKey(rejection), { seconds: VIDEO_MAX_SECONDS }),
        );
        return;
      }
      setUploading(true);
      insertSnippet(await upload(asset.uri));
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error instanceof Error ? error.message : i18n.t(errorKey));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async (): Promise<PickedMedia | null> => {
    const uri = await imageUploadService.pickContentImage();
    return uri ? { uri } : null;
  };

  return {
    panel,
    uploading,
    gifSearchEnabled: gifSearchEnabled(),
    open: () => setPanel('source'),
    close: () => setPanel('none'),
    openGifSearch: () => setPanel('gifSearch'),

    insertImage: () => run(
      pickImage,
      noCheck,
      async uri => buildImageToken(await imageUploadService.uploadStoryContentImage(uri)),
      'imageUpload.contentError',
    ),
    insertGif: () => run(
      pickStoryGif,
      checkGifAsset,
      async uri => buildImageToken(await uploadStoryGif(uri)),
      'mediaUpload.gifError',
    ),
    insertVideo: () => run(
      pickStoryVideo,
      checkVideoAsset,
      async uri => {
        const { poster, video } = await uploadStoryVideo(uri);
        return buildVideoToken(poster, video);
      },
      'mediaUpload.videoError',
    ),
    /** Hazır GIF: sağlayıcının adresi olduğu gibi gömülür, yükleme yoktur. */
    insertGifUrl: (url: string) => insertSnippet(buildImageToken(url)),
  };
}

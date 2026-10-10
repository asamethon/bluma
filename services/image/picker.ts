import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import * as ImagePicker from 'expo-image-picker';

type Source = 'library' | 'camera';
type PickOptions = { aspect?: [number, number]; quality: number; editing?: boolean };

// İzin hatası kullanıcıya olduğu gibi gösterilmeli; bu yüzden seçim
// hatalarını saran try/catch'in DIŞINDA fırlatılır.
async function ensurePermission(source: Source) {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  // iOS'ta "seçili fotoğraflar" (limited) da granted sayılır; seçici açılır.
  if (permission.granted) return;
  throw new Error(
    i18n.t(source === 'camera' ? 'imageUpload.cameraPermission' : 'imageUpload.galleryPermission'),
  );
}

async function pick(source: Source, options: PickOptions, errorKey: string): Promise<string | null> {
  await ensurePermission(source);
  const { editing = true, ...rest } = options;
  try {
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: editing,
          ...rest,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: editing,
          ...rest,
        });
    if (result.canceled) return null;
    const uri = result.assets?.[0]?.uri;
    // İptal edilmediği halde varlık dönmüyorsa sessizce yutma: kullanıcı
    // "hiçbir şey olmadı" ile baş başa kalmasın.
    if (!uri) throw new Error('Picker returned no asset');
    return uri;
  } catch (error) {
    logger.error(`Image pick error (${source}):`, error);
    throw new Error(i18n.t(errorKey));
  }
}

export const pickImageFromGallery = () => pick('library', { aspect: [3, 4], quality: 0.8 }, 'imageUpload.pickError');
export const takePhotoWithCamera = () => pick('camera', { aspect: [3, 4], quality: 0.8 }, 'imageUpload.captureError');
export const pickCommentImage = () => pick('library', { aspect: [4, 3], quality: 0.5 }, 'imageUpload.pickError');
export const pickContentImage = () => pick('library', { quality: 0.8 }, 'imageUpload.pickError');
// Sohbette çekilen fotoğraf kırpma ekranından geçmez: kare kırpma sohbet
// fotoğrafını bozar, kullanıcı da çektiğini olduğu gibi göndermek ister.
export const captureCommentImage = () => pick('camera', { quality: 0.5, editing: false }, 'imageUpload.captureError');

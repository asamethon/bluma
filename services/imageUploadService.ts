import { IMAGE_SERVER_URL } from '@/constants/config';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

type ImageKind = 'profile' | 'cover' | 'comment' | 'content';

function taggedError(code: string, message: string) {
  const e = new Error(message) as Error & { code: string };
  e.code = code;
  return e;
}

function isExplicitRejection(error: unknown): boolean {
  return (error as any)?.code === 'explicit-content';
}
function isTooLarge(error: unknown): boolean {
  return (error as any)?.code === 'image-too-large';
}

const CLIENT_COMPRESSION: Record<ImageKind, { width: number; compress: number }> = {
  profile: { width: 512, compress: 0.7 },
  cover: { width: 900, compress: 0.75 },
  comment: { width: 400, compress: 0.3 },
  content: { width: 1000, compress: 0.75 },
};

async function compressImage(imageUri: string, kind: ImageKind): Promise<string> {
  const cfg = CLIENT_COMPRESSION[kind];
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: cfg.width } }],
    { compress: cfg.compress, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
}

function stripFilePrefix(uri: string): string {
  return Platform.OS === 'ios' && uri.startsWith('file://') ? uri.replace('file://', '') : uri;
}

async function toBase64DataUrl(imageUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(stripFilePrefix(imageUri), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

async function uploadToImageServer(imageUri: string, kind: ImageKind): Promise<string | null> {
  if (!IMAGE_SERVER_URL) {
    logger.debug('[imageUpload] IMAGE_SERVER_URL boş — base64 fallback kullanılacak');
    return null;
  }
  try {
    logger.debug(`[imageUpload] ${kind} görseli sunucuya yükleniyor: ${IMAGE_SERVER_URL}`);
    const currentUser = getAuth().currentUser;
    const idToken = currentUser ? await getIdToken(currentUser) : undefined;
    if (!idToken) {
      logger.warn('Image server: no signed-in user / ID token, falling back to base64');
      return null;
    }

    const response = await FileSystem.uploadAsync(
      `${IMAGE_SERVER_URL}/upload?kind=${kind}`,
      imageUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'image',
        mimeType: 'image/jpeg',
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    if (response.status === 451) {
      logger.warn('Image server rejected explicit content (451)');
      throw taggedError('explicit-content', i18n.t('imageUpload.explicitRejected'));
    }
    if (response.status !== 200) {
      logger.warn(`Image server upload failed: HTTP ${response.status} ${(response.body || '').slice(0, 200)}`);
      return null;
    }
    const data = JSON.parse(response.body || '{}');
    if (typeof data?.url !== 'string') {
      logger.warn('Image server: unexpected response shape', (response.body || '').slice(0, 200));
      return null;
    }
    logger.debug('[imageUpload] Yükleme başarılı:', data.url);
    return data.url;
  } catch (error) {
    if (isExplicitRejection(error)) throw error;
    logger.warn('Image server unreachable, falling back to base64:', error);
    return null;
  }
}

async function processAndUpload(imageUri: string, kind: ImageKind, errorKey: string): Promise<string> {
  try {
    const compressedUri = await compressImage(imageUri, kind);

    const remoteUrl = await uploadToImageServer(compressedUri, kind);
    if (remoteUrl) return remoteUrl;

    let dataUrl = await toBase64DataUrl(compressedUri);
    if (dataUrl.length > 400000 && kind === 'comment') {
      const smaller = await ImageManipulator.manipulateAsync(
        compressedUri,
        [{ resize: { width: 300 } }],
        { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG }
      );
      dataUrl = await toBase64DataUrl(smaller.uri);
      if (dataUrl.length > 400000) {
        throw taggedError('image-too-large', i18n.t('imageUpload.tooLarge'));
      }
    }
    return dataUrl;
  } catch (error) {
    logger.error(`Error processing ${kind} image:`, error);
    if (isExplicitRejection(error) || isTooLarge(error)) {
      throw error;
    }
    throw new Error(i18n.t(errorKey));
  }
}

export const imageUploadService = {
  async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'profile', 'imageUpload.profileError');
  },

  async uploadBookCover(bookId: string, imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'cover', 'imageUpload.coverError');
  },

  async uploadCommentImage(imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'comment', 'imageUpload.commentError');
  },

  async uploadStoryContentImage(imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'content', 'imageUpload.contentError');
  },

  async pickImageFromGallery(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error(i18n.t('imageUpload.galleryPermission'));
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      logger.error('Error picking image from gallery:', error);
      throw new Error(i18n.t('imageUpload.pickError'));
    }
  },

  async takePhotoWithCamera(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error(i18n.t('imageUpload.cameraPermission'));
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      logger.error('Error taking photo with camera:', error);
      throw new Error(i18n.t('imageUpload.captureError'));
    }
  },

  async deleteProfileImage(imageUrl: string): Promise<void> {
    return;
  },

  async pickCommentImage(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error(i18n.t('imageUpload.galleryPermission'));
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      logger.error('Error picking comment image:', error);
      throw new Error(i18n.t('imageUpload.pickError'));
    }
  },

  async pickContentImage(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error(i18n.t('imageUpload.galleryPermission'));
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      logger.error('Error picking content image:', error);
      throw new Error(i18n.t('imageUpload.pickError'));
    }
  },

  getOptimizedImageUrl(imageUrl: string, size: number = 200): string {
    if (!imageUrl) return '';

    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    return imageUrl;
  }
};

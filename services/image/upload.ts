import { IMAGE_SERVER_URL } from '@/constants/config';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export type ImageKind = 'profile' | 'cover' | 'comment' | 'content';

/** Sunucu reddi ve boyut aşımı çağırana ayırt edilebilir şekilde ulaşmalı. */
const TAGGED_CODES = new Set(['explicit-content', 'image-too-large']);
const isTagged = (error: unknown) => TAGGED_CODES.has((error as { code?: string })?.code ?? '');

const taggedError = (code: string, message: string) =>
  Object.assign(new Error(message), { code });

const COMPRESSION: Record<ImageKind, { width: number; compress: number }> = {
  profile: { width: 512, compress: 0.7 },
  cover: { width: 900, compress: 0.75 },
  comment: { width: 400, compress: 0.3 },
  content: { width: 1000, compress: 0.75 },
};

/** Base64 yedeğinin Firestore doküman sınırına takılmadığı üst değer. */
const MAX_INLINE_LENGTH = 400_000;

const resize = (uri: string, width: number, compress: number) =>
  ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], {
    compress,
    format: ImageManipulator.SaveFormat.JPEG,
  });

async function toBase64DataUrl(imageUri: string): Promise<string> {
  const path = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
  const base64 = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64 });
  return `data:image/jpeg;base64,${base64}`;
}

/** VPS görsel servisi; ulaşılamazsa null döner ve base64 yedeğine düşülür. */
async function uploadToImageServer(imageUri: string, kind: ImageKind): Promise<string | null> {
  if (!IMAGE_SERVER_URL) return null;
  try {
    const currentUser = getAuth().currentUser;
    const idToken = currentUser ? await getIdToken(currentUser) : null;
    if (!idToken) {
      logger.warn('Image server: oturum yok, base64 yedeğine düşülüyor');
      return null;
    }

    const response = await FileSystem.uploadAsync(`${IMAGE_SERVER_URL}/upload?kind=${kind}`, imageUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'image',
      mimeType: 'image/jpeg',
      headers: { Authorization: `Bearer ${idToken}` },
    });

    // 451: moderasyon katmanı görseli reddetti — yedeğe düşmek yasak.
    if (response.status === 451) {
      throw taggedError('explicit-content', i18n.t('imageUpload.explicitRejected'));
    }
    if (response.status !== 200) {
      logger.warn(`Image server upload failed: HTTP ${response.status}`);
      return null;
    }

    const url = (JSON.parse(response.body || '{}') as { url?: unknown }).url;
    return typeof url === 'string' ? url : null;
  } catch (error) {
    if (isTagged(error)) throw error;
    logger.warn('Image server unreachable, falling back to base64:', error);
    return null;
  }
}

async function toInlineImage(compressedUri: string, kind: ImageKind): Promise<string> {
  const dataUrl = await toBase64DataUrl(compressedUri);
  if (dataUrl.length <= MAX_INLINE_LENGTH || kind !== 'comment') return dataUrl;

  const smaller = await toBase64DataUrl((await resize(compressedUri, 300, 0.1)).uri);
  if (smaller.length > MAX_INLINE_LENGTH) {
    throw taggedError('image-too-large', i18n.t('imageUpload.tooLarge'));
  }
  return smaller;
}

export async function uploadImage(imageUri: string, kind: ImageKind, errorKey: string): Promise<string> {
  try {
    const { width, compress } = COMPRESSION[kind];
    const compressed = (await resize(imageUri, width, compress)).uri;
    return (await uploadToImageServer(compressed, kind)) ?? (await toInlineImage(compressed, kind));
  } catch (error) {
    logger.error(`Error processing ${kind} image:`, error);
    if (isTagged(error)) throw error;
    throw new Error(i18n.t(errorKey));
  }
}

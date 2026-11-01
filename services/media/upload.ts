import { IMAGE_SERVER_URL } from '@/constants/config';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';
import { VIDEO_MAX_SECONDS } from './limits';

/**
 * Video ve GIF'i VPS medya servisine yükler.
 *
 * Görsellerdeki base64 yedeği burada YOKTUR: ne video ne animasyonlu GIF
 * Firestore doküman sınırına sığar. Daha önemlisi, yedeğe düşmek moderasyonu
 * atlamak olurdu — sunucuya ulaşılamıyorsa yükleme başarısız olur.
 */

/** Sunucunun ret kodları → kullanıcıya gösterilecek çeviri anahtarı. */
const CODE_KEYS: Record<string, string> = {
  explicit_content: 'mediaUpload.explicitRejected',
  video_too_long: 'mediaUpload.videoTooLong',
  video_too_large: 'mediaUpload.videoTooLarge',
  unsupported_video: 'mediaUpload.videoUnsupported',
  gif_too_large: 'mediaUpload.gifTooLarge',
  gif_too_long: 'mediaUpload.gifTooLong',
  unsupported_gif: 'mediaUpload.gifUnsupported',
  file_too_large: 'mediaUpload.tooLarge',
};

type Body = { url?: unknown; video?: unknown; poster?: unknown; error?: unknown };

const parse = (body: string | undefined): Body => {
  try {
    return JSON.parse(body || '{}') as Body;
  } catch {
    return {};
  }
};

async function post(uri: string, endpoint: string, mimeType: string, errorKey: string): Promise<Body> {
  const failed = () => new Error(i18n.t(errorKey));
  if (!IMAGE_SERVER_URL) throw failed();

  const currentUser = getAuth().currentUser;
  const idToken = currentUser ? await getIdToken(currentUser) : null;
  if (!idToken) throw failed();

  const response = await FileSystem.uploadAsync(`${IMAGE_SERVER_URL}${endpoint}`, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (response.status !== 200) {
    const code = String(parse(response.body).error ?? '');
    logger.warn(`Media upload failed: HTTP ${response.status} (${code})`);
    throw new Error(i18n.t(CODE_KEYS[code] ?? errorKey, { seconds: VIDEO_MAX_SECONDS }));
  }
  return parse(response.body);
}

/** Döner: poster ve video adresleri (token poster'ı taşır). */
export async function uploadStoryVideo(uri: string): Promise<{ poster: string; video: string }> {
  const body = await post(uri, '/upload-video', 'video/mp4', 'mediaUpload.videoError');
  if (typeof body.poster !== 'string' || typeof body.video !== 'string') {
    throw new Error(i18n.t('mediaUpload.videoError'));
  }
  return { poster: body.poster, video: body.video };
}

/** Döner: animasyonlu webp adresi (eski istemciler de oynatır). */
export async function uploadStoryGif(uri: string): Promise<string> {
  const body = await post(uri, '/upload-gif', 'image/gif', 'mediaUpload.gifError');
  if (typeof body.url !== 'string') throw new Error(i18n.t('mediaUpload.gifError'));
  return body.url;
}

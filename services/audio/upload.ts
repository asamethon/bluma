import { IMAGE_SERVER_URL } from '@/constants/config';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Ses kaydını VPS servisine yükler.
 *
 * Görsellerdeki base64 yedeği burada YOKTUR: bir ses kaydı Firestore doküman
 * sınırına sığmaz. Sunucuya ulaşılamıyorsa gönderim başarısız olur ve kullanıcı
 * bunu görür — sessizce yarım bir mesaj bırakmaktan iyidir.
 */
export async function uploadVoiceMessage(uri: string): Promise<string> {
  const failed = () => new Error(i18n.t('messages.voiceUploadFailed'));
  if (!IMAGE_SERVER_URL) throw failed();

  const currentUser = getAuth().currentUser;
  const idToken = currentUser ? await getIdToken(currentUser) : null;
  if (!idToken) throw failed();

  try {
    const response = await FileSystem.uploadAsync(`${IMAGE_SERVER_URL}/upload-voice`, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'audio/m4a',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (response.status !== 200) {
      logger.warn(`Voice upload failed: HTTP ${response.status}`);
      throw failed();
    }
    const url = (JSON.parse(response.body || '{}') as { url?: unknown }).url;
    if (typeof url !== 'string') throw failed();
    return url;
  } catch (error) {
    logger.error('Voice upload error:', error);
    throw failed();
  }
}

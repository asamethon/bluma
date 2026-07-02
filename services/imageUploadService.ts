import { IMAGE_SERVER_URL } from '@/constants/config';
import auth from '@react-native-firebase/auth';
// SDK 54+ 'expo-file-system' ana girişinden readAsStringAsync'i kaldırdı;
// base64 fallback için legacy girişini kullanıyoruz.
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Görsel türleri — sunucu tarafındaki boyutlandırmayla eşleşir (server/index.js).
type ImageKind = 'profile' | 'cover' | 'comment';

// İstemci tarafı ön-sıkıştırma: yükleme boyutunu düşürür; sunucu yoksa
// base64 fallback'inin Firestore'a sığmasını sağlar.
const CLIENT_COMPRESSION: Record<ImageKind, { width: number; compress: number }> = {
  profile: { width: 512, compress: 0.7 },
  cover: { width: 900, compress: 0.75 },
  comment: { width: 400, compress: 0.3 },
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

// iOS file:// öneki FileSystem okumaları için kaldırılır.
function stripFilePrefix(uri: string): string {
  return Platform.OS === 'ios' && uri.startsWith('file://') ? uri.replace('file://', '') : uri;
}

async function toBase64DataUrl(imageUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(stripFilePrefix(imageUri), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

// Görseli VPS görsel servisine yükler ve kalıcı URL döndürür.
// Sunucu yapılandırılmamışsa veya yükleme başarısız olursa null döner;
// çağıran base64 fallback'ine düşer.
async function uploadToImageServer(imageUri: string, kind: ImageKind): Promise<string | null> {
  if (!IMAGE_SERVER_URL) {
    console.log('[imageUpload] IMAGE_SERVER_URL boş — base64 fallback kullanılacak');
    return null;
  }
  try {
    console.log(`[imageUpload] ${kind} görseli sunucuya yükleniyor: ${IMAGE_SERVER_URL}`);
    const idToken = await auth().currentUser?.getIdToken();
    if (!idToken) {
      console.warn('Image server: no signed-in user / ID token, falling back to base64');
      return null;
    }

    // NOT: fetch + FormData({uri,...}) SDK 54+ fetch'inde çalışmıyor
    // ("Unsupported FormDataPart implementation"). uploadAsync multipart'ı
    // native tarafta kurar; dosya URI'si file:// önekiyle verilmelidir.
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

    if (response.status !== 200) {
      console.warn(`Image server upload failed: HTTP ${response.status} ${(response.body || '').slice(0, 200)}`);
      return null;
    }
    const data = JSON.parse(response.body || '{}');
    if (typeof data?.url !== 'string') {
      console.warn('Image server: unexpected response shape', (response.body || '').slice(0, 200));
      return null;
    }
    console.log('[imageUpload] Yükleme başarılı:', data.url);
    return data.url;
  } catch (error) {
    console.warn('Image server unreachable, falling back to base64:', error);
    return null;
  }
}

// Ortak akış: sıkıştır → sunucuya yükle → olmadıysa base64 döndür.
async function processAndUpload(imageUri: string, kind: ImageKind, errorMessage: string): Promise<string> {
  try {
    const compressedUri = await compressImage(imageUri, kind);

    const remoteUrl = await uploadToImageServer(compressedUri, kind);
    if (remoteUrl) return remoteUrl;

    // Fallback: sıkıştırılmış base64 (Firestore 1MB doküman limiti için
    // boyut kontrolü aşağıda, yorum görselinde daha agresif ikinci geçiş).
    let dataUrl = await toBase64DataUrl(compressedUri);
    if (dataUrl.length > 400000 && kind === 'comment') {
      const smaller = await ImageManipulator.manipulateAsync(
        compressedUri,
        [{ resize: { width: 300 } }],
        { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG }
      );
      dataUrl = await toBase64DataUrl(smaller.uri);
      if (dataUrl.length > 400000) {
        throw new Error('Resim çok büyük. Lütfen daha küçük bir resim seçin.');
      }
    }
    return dataUrl;
  } catch (error) {
    console.error(`Error processing ${kind} image:`, error);
    if (error instanceof Error && error.message.includes('çok büyük')) {
      throw error;
    }
    throw new Error(errorMessage);
  }
}

export const imageUploadService = {
  // Profil fotoğrafı — sunucu varsa URL, yoksa sıkıştırılmış base64 döner.
  async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'profile', 'Profil fotoğrafı işlenirken bir hata oluştu.');
  },

  // Kitap kapağı
  async uploadBookCover(bookId: string, imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'cover', 'Kitap kapağı işlenirken bir hata oluştu.');
  },

  // Yorum görseli
  async uploadCommentImage(imageUri: string): Promise<string> {
    return processAndUpload(imageUri, 'comment', 'Yorum resmi işlenirken bir hata oluştu.');
  },

  // Galeriden resim seç
  async pickImageFromGallery(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error('Galeri erişim izni gerekli.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Kitap kapağı oranı
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      throw new Error('Resim seçilirken bir hata oluştu.');
    }
  },

  // Kameradan resim çek
  async takePhotoWithCamera(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error('Kamera erişim izni gerekli.');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4], // Kitap kapağı oranı
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      throw new Error('Fotoğraf çekilirken bir hata oluştu.');
    }
  },

  // Eski profil fotoğrafını sil. Base64 için işlem gerekmez; sunucudaki
  // dosyalar için silme ucu bilinçli olarak yok — URL'ler içerik-değişmez ve
  // eski dosyalar zararsız (istenirse sunucuda periyodik temizlik yapılır).
  async deleteProfileImage(imageUrl: string): Promise<void> {
    return;
  },

  // Yorum için resim seç
  async pickCommentImage(): Promise<string | null> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        throw new Error('Galeri erişim izni gerekli.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3], // Yorum resmi oranı
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking comment image:', error);
      throw new Error('Resim seçilirken bir hata oluştu.');
    }
  },

  // Profil fotoğrafı URL'ini optimize et
  getOptimizedImageUrl(imageUrl: string, size: number = 200): string {
    if (!imageUrl) return '';

    // Base64 formatında ise direkt döndür
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    return imageUrl;
  }
};

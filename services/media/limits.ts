// Hikâye medyasının istemci tarafı sınırları. Sunucu aynı sınırları yeniden
// uygular (server/video.js, server/gif.js) — buradaki kontrol kullanıcıya
// hatayı yüklemeden ÖNCE göstermek içindir, güvenlik sınırı değildir.
//
// 20 sn / 720p ≈ 3,7 MB saklanan video: VPS'in 100 GB diski ve 8 TB/ay
// trafiği bu boyda on binlerce videoyu ve milyonlarca izlenmeyi kaldırır.

export const VIDEO_MAX_SECONDS = 20;
/** Yükleme girişi: kamera kaydı sunucuda 720p'ye indirilmeden önce bu kadar olabilir. */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const GIF_MAX_BYTES = 12 * 1024 * 1024;

export type MediaRejection = 'video-too-long' | 'video-too-large' | 'gif-too-large';

type Asset = { duration?: number | null; fileSize?: number | null };

/** Süre bazı cihazlarda gelmez; bilinmiyorsa sunucudaki ffprobe'a bırakılır. */
export function checkVideoAsset(asset: Asset): MediaRejection | null {
  const seconds = asset.duration == null ? null : asset.duration / 1000;
  // Yarım saniyelik tolerans: seçicinin süre sınırı yuvarlama yüzünden
  // 20,02 sn'lik bir kayıt döndürebiliyor.
  if (seconds != null && seconds > VIDEO_MAX_SECONDS + 0.5) return 'video-too-long';
  if (asset.fileSize != null && asset.fileSize > VIDEO_MAX_BYTES) return 'video-too-large';
  return null;
}

export function checkGifAsset(asset: Asset): MediaRejection | null {
  return asset.fileSize != null && asset.fileSize > GIF_MAX_BYTES ? 'gif-too-large' : null;
}

export const mediaRejectionKey = (rejection: MediaRejection) => `mediaUpload.${
  { 'video-too-long': 'videoTooLong', 'video-too-large': 'videoTooLarge', 'gif-too-large': 'gifTooLarge' }[rejection]
}`;

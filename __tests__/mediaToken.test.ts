import {
  buildImageToken,
  buildVideoToken,
  parseMediaToken,
  stripMediaTokens,
} from '@/features/story/utils/mediaToken';
import {
  checkGifAsset,
  checkVideoAsset,
  GIF_MAX_BYTES,
  mediaRejectionKey,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_SECONDS,
} from '@/services/media/limits';

const POSTER = 'https://img.example.com/i/video/1-abc.webp';
const VIDEO = 'https://img.example.com/i/video/1-abc.mp4';

describe('medya token biçimi', () => {
  it('görsel token\'ını kendi paragrafına yerleştirir', () => {
    expect(buildImageToken('https://x/y.webp')).toBe('\n\n[[img:https://x/y.webp]]\n\n');
  });

  it('görsel token\'ını geri okur', () => {
    expect(parseMediaToken('[[img:https://x/y.webp]]')).toEqual({
      kind: 'image',
      url: 'https://x/y.webp',
    });
  });

  it('video token\'ı poster ile video adresini tek adreste taşır', () => {
    expect(buildVideoToken(POSTER, VIDEO)).toBe(`\n\n[[img:${POSTER}#v=mp4]]\n\n`);
  });

  it('video token\'ı gidip geri döner', () => {
    const token = buildVideoToken(POSTER, VIDEO).trim();
    expect(parseMediaToken(token)).toEqual({ kind: 'video', poster: POSTER, video: VIDEO });
  });

  // 3.0.x istemcileri `#v=` işaretini tanımaz; token'ı görsel sanıp posteri
  // çizmeleri gerekir. Bu yüzden token ailesi `img` olarak KALMALI.
  it('eski istemcinin gördüğü adres posterdir', () => {
    const token = buildVideoToken(POSTER, VIDEO).trim();
    expect(token.startsWith('[[img:')).toBe(true);
    expect(token).toContain(POSTER);
  });

  it('tanımadığı işareti görsel gibi çizer, token metnini sızdırmaz', () => {
    expect(parseMediaToken('[[img:https://x/y.webp#v=çok-uzun-uzanti]]')).toEqual({
      kind: 'image',
      url: 'https://x/y.webp#v=çok-uzun-uzanti',
    });
  });

  it('uzantısız posteri video sanmaz', () => {
    expect(parseMediaToken('[[img:https://x/poster#v=mp4]]')).toEqual({
      kind: 'image',
      url: 'https://x/poster#v=mp4',
    });
  });

  it('token olmayan paragrafa null döner', () => {
    expect(parseMediaToken('Bir sabah uyandığında.')).toBeNull();
    expect(parseMediaToken('[[img:https://x/y.webp]] ve ardından metin')).toBeNull();
  });

  it('sayım için hem görsel hem video token\'ını metinden siler', () => {
    const content = `Giriş.${buildImageToken('https://x/a.webp')}Orta.${buildVideoToken(POSTER, VIDEO)}Son.`;
    expect(stripMediaTokens(content)).toBe('Giriş.\n\nOrta.\n\nSon.');
  });
});

describe('medya sınırları', () => {
  it('sınır içindeki videoyu geçirir', () => {
    expect(checkVideoAsset({ duration: VIDEO_MAX_SECONDS * 1000, fileSize: 1024 })).toBeNull();
  });

  it('uzun videoyu reddeder', () => {
    expect(checkVideoAsset({ duration: (VIDEO_MAX_SECONDS + 5) * 1000 })).toBe('video-too-long');
  });

  it('seçicinin yuvarlama payını reddetmez', () => {
    expect(checkVideoAsset({ duration: VIDEO_MAX_SECONDS * 1000 + 300 })).toBeNull();
  });

  it('büyük videoyu reddeder', () => {
    expect(checkVideoAsset({ duration: 5000, fileSize: VIDEO_MAX_BYTES + 1 })).toBe('video-too-large');
  });

  it('süre bilinmiyorsa kararı sunucuya bırakır', () => {
    expect(checkVideoAsset({ duration: null, fileSize: 1024 })).toBeNull();
    expect(checkVideoAsset({})).toBeNull();
  });

  it('büyük GIF\'i reddeder, sınırdakini geçirir', () => {
    expect(checkGifAsset({ fileSize: GIF_MAX_BYTES + 1 })).toBe('gif-too-large');
    expect(checkGifAsset({ fileSize: GIF_MAX_BYTES })).toBeNull();
  });

  it('her ret için bir çeviri anahtarı üretir', () => {
    expect(mediaRejectionKey('video-too-long')).toBe('mediaUpload.videoTooLong');
    expect(mediaRejectionKey('video-too-large')).toBe('mediaUpload.videoTooLarge');
    expect(mediaRejectionKey('gif-too-large')).toBe('mediaUpload.gifTooLarge');
  });
});

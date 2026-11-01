// Hikâye metninde medya, kendi paragrafında duran bir token ile taşınır:
//
//   [[img:<url>]]                 — görsel ya da animasyonlu GIF/WebP
//   [[img:<poster>.webp#v=mp4]]   — video: poster karesi + yanındaki video dosyası
//
// Video token'ı bilerek `img` ailesinde kalır: mağazadaki 3.0.x istemciler
// adresin `#v=` parçasını yok sayıp POSTER karesini çizer, yani eski okuyucuda
// çıplak token metni değil duran bir kare görünür. Poster ile video dosyası
// sunucuda aynı adı paylaşır (bkz. server/video.js), bu yüzden token'da tek
// adres taşımak yeterlidir.

const TOKEN_RE = /^\[\[img:(.+?)\]\]$/;
const TOKEN_GLOBAL_RE = /\n{0,2}\[\[img:.+?\]\]\n{0,2}/g;
const VIDEO_MARK = '#v=';
const EXT_RE = /^[a-z0-9]{2,5}$/i;

export type ParsedMedia =
  | { kind: 'image'; url: string }
  | { kind: 'video'; poster: string; video: string };

export function buildImageToken(url: string): string {
  return `\n\n[[img:${url}]]\n\n`;
}

/** Poster ve video adresleri yalnızca uzantıda ayrışır; token posteri taşır. */
export function buildVideoToken(posterUrl: string, videoUrl: string): string {
  const ext = videoUrl.slice(videoUrl.lastIndexOf('.') + 1);
  return `\n\n[[img:${posterUrl}${VIDEO_MARK}${ext}]]\n\n`;
}

export function parseMediaToken(paragraph: string): ParsedMedia | null {
  const match = paragraph.trim().match(TOKEN_RE);
  if (!match) return null;

  const url = match[1];
  const mark = url.lastIndexOf(VIDEO_MARK);
  if (mark < 0) return { kind: 'image', url };

  const poster = url.slice(0, mark);
  const ext = url.slice(mark + VIDEO_MARK.length);
  const video = poster.replace(/\.[^./]+$/, `.${ext}`);
  // Tanımadığımız bir işaret varsa adresi görsel gibi çiz: eski davranış,
  // kırık token metni değil.
  if (!EXT_RE.test(ext) || video === poster) return { kind: 'image', url };
  return { kind: 'video', poster, video };
}

/** Kelime/karakter sayımı ve okuma süresi medyayı saymaz. */
export function stripMediaTokens(content: string): string {
  return content.replace(TOKEN_GLOBAL_RE, '\n\n');
}

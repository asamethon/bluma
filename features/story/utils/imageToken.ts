// Hikaye içeriğine gömülü resimler için satır-içi belirteç (token) biçimi.
// İçerik düz metin olarak saklandığından ([[img:URL]] gibi), yazarken
// insertAtCursor ile eklenir; okuyucu ve önizleme ekranları paragraf
// bölmesinde bu belirteci tanıyıp <Image> olarak render eder.
const IMAGE_TOKEN_RE = /^\[\[img:(.+?)\]\]$/;
const IMAGE_TOKEN_GLOBAL_RE = /\n{0,2}\[\[img:.+?\]\]\n{0,2}/g;

export function buildImageToken(url: string): string {
  return `\n\n[[img:${url}]]\n\n`;
}

// Bir paragrafın resim belirteci olup olmadığını kontrol eder; ise URL'i döner.
export function parseImageToken(paragraph: string): string | null {
  const m = paragraph.trim().match(IMAGE_TOKEN_RE);
  return m ? m[1] : null;
}

// Kelime/karakter sayacı ve doğrulama gerçek yazılan metne baksın diye
// resim belirteçlerini içerikten çıkarır.
export function stripImageTokens(content: string): string {
  return content.replace(IMAGE_TOKEN_GLOBAL_RE, '\n\n');
}

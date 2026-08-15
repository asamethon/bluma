const IMAGE_TOKEN_RE = /^\[\[img:(.+?)\]\]$/;
const IMAGE_TOKEN_GLOBAL_RE = /\n{0,2}\[\[img:.+?\]\]\n{0,2}/g;

export function buildImageToken(url: string): string {
  return `\n\n[[img:${url}]]\n\n`;
}

export function parseImageToken(paragraph: string): string | null {
  const m = paragraph.trim().match(IMAGE_TOKEN_RE);
  return m ? m[1] : null;
}

export function stripImageTokens(content: string): string {
  return content.replace(IMAGE_TOKEN_GLOBAL_RE, '\n\n');
}

/**
 * Profildeki web sitesi. Kullanıcı "siten.com" da yazabilir; şema yoksa
 * https eklenir. Yalnızca http(s) açılır — `javascript:`, `mailto:` ya da
 * uygulama şemaları reddedilir. Etiket şemasız ve sondaki "/" olmadan.
 */
export function profileWebsite(raw?: string | null): { url: string; label: string } | null {
  const value = raw?.trim();
  if (!value || /\s/.test(value)) return null;
  const hasHttp = /^https?:\/\//i.test(value);
  // "siten.com:8080" bir şema değil; "javascript:..." ya da "mailto:..." öyle.
  if (!hasHttp && /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(value)) return null;
  const url = hasHttp ? value : `https://${value}`;
  const match = url.match(/^https?:\/\/([^/?#]+)(.*)$/i);
  if (!match || !match[1].includes('.')) return null;
  const label = `${match[1]}${match[2]}`.replace(/\/+$/, '').replace(/^www\./i, '');
  return { url, label };
}

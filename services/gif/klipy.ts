import { KLIPY_API_KEY } from '@/constants/config';
import i18n from '@/i18n';
import { store } from '@/store';
import { logger } from '@/utils/logger';

const BASE_URL = 'https://api.klipy.com/api/v1';
const PAGE_SIZE = 24;
/** Küçükten büyüğe tercih sırası; sağlayıcı her boyu her içerikte vermiyor. */
const SIZES = ['md', 'sm', 'hd', 'xs'];

export type GifMedia = {
  id: string;
  /** Izgarada gösterilen küçük kopya. */
  preview: string;
  /** Mesajda gönderilen kopya. */
  url: string;
  width: number;
  height: number;
  description: string;
};

export type GifPage = { items: GifMedia[]; nextPage: number | null };

type KlipyFile = { url?: string; width?: number; height?: number };
type KlipyItem = {
  id?: number | string;
  slug?: string;
  title?: string;
  file?: Record<string, Record<string, KlipyFile>>;
};

export const gifSearchEnabled = () => KLIPY_API_KEY.length > 0;

const pickFile = (item: KlipyItem, formats: string[]): KlipyFile | null => {
  for (const size of SIZES) {
    const bucket = item.file?.[size];
    if (!bucket) continue;
    const match = formats.map(format => bucket[format]).find(file => !!file?.url);
    if (match) return match;
  }
  return null;
};

/** Çıkartmalar saydam zeminlidir: webp/png tercih edilir, GIF'lerde webp/gif. */
function toMedia(item: KlipyItem, sticker: boolean): GifMedia | null {
  const formats = sticker ? ['webp', 'png', 'gif'] : ['webp', 'gif'];
  const full = pickFile(item, formats);
  if (!full?.url) return null;
  const key = item.slug || item.id;
  return {
    id: String(key ?? full.url),
    url: full.url,
    preview: full.url,
    width: full.width || 200,
    height: full.height || 200,
    description: item.title || '',
  };
}

/**
 * KLIPY araması (Tenor'un yerine geçen ücretsiz servis). Sorgu boşsa öne
 * çıkanlar döner. `content_filter=high` en katı süzgeçtir — uygulamanın içerik
 * politikası explicit içeriğe kapalı.
 *
 * Sağlayıcının entegrasyon kuralı gereği medya, dönen adresten DOĞRUDAN
 * yüklenir; kendi sunucumuza kopyalanmaz ve sonuç sırası değiştirilmez.
 */
export async function fetchGifs(params: {
  query: string;
  sticker: boolean;
  page?: number;
}): Promise<GifPage> {
  if (!gifSearchEnabled()) return { items: [], nextPage: null };
  const { query, sticker, page = 1 } = params;
  const collection = sticker ? 'stickers' : 'gifs';
  const endpoint = query.trim() ? 'search' : 'trending';
  const search = new URLSearchParams({
    page: String(page),
    per_page: String(PAGE_SIZE),
    content_filter: 'high',
    locale: (i18n.language || 'tr').slice(0, 2),
    format_filter: sticker ? 'webp,png,gif' : 'webp,gif',
  });
  if (query.trim()) search.set('q', query.trim());
  // Aynı kullanıcı için sabit kalması isteniyor (öneri/son kullanılanlar için).
  const customerId = store.getState().auth.user?.id;
  if (customerId) search.set('customer_id', customerId);

  try {
    const response = await fetch(
      `${BASE_URL}/${KLIPY_API_KEY}/${collection}/${endpoint}?${search.toString()}`,
    );
    if (!response.ok) {
      logger.warn(`Klipy ${collection}/${endpoint} failed: HTTP ${response.status}`);
      throw new Error(i18n.t('messages.gifLoadFailed'));
    }
    const body = (await response.json()) as {
      data?: { data?: KlipyItem[]; current_page?: number; has_next?: boolean };
    };
    const items = (body.data?.data || [])
      .map(item => toMedia(item, sticker))
      .filter((media): media is GifMedia => !!media);
    const current = body.data?.current_page || page;
    return { items, nextPage: body.data?.has_next ? current + 1 : null };
  } catch (error) {
    logger.error('Klipy fetch error:', error);
    throw new Error(i18n.t('messages.gifLoadFailed'));
  }
}

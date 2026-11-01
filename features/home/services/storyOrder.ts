import type { Story } from '@/types';
import { toMillis } from '@/utils/time';

const DAY = 24 * 60 * 60 * 1000;

/** Kapak sıralamasının uygulandığı blok boyu (bkz. `coverLastInBlocks`). */
const COVER_BLOCK = 12;

/** Yerel takvime göre gün numarası; editör seçkisi her gün bir sonrakine döner. */
export function localDayNumber(now: number): number {
  const date = new Date(now);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
}

export const newestFirst = (left: Story, right: Story) =>
  toMillis(right.createdAt) - toMillis(left.createdAt);

const hasCover = (story: Story) => !!story.coverImage?.trim();

/**
 * Kapağı olan hikâyeler önce, kapaksızlar sonda; her iki kümenin kendi içindeki
 * sırası (hız, yenilik, öneri — bölüm ne sıraladıysa) korunur.
 *
 * Neden: kapaksız hikâye eskiden rafların `requireCover` kuralıyla vitrinden
 * TÜMDEN eleniyordu, yani yazarın kapak koymaması hikâyeyi ana sayfadan silmek
 * anlamına geliyordu. Artık eleme yok: kart yerini koruyor, yalnızca satırın
 * (ya da sütunun) sonuna iniyor.
 */
export function coverLast(stories: Story[]): Story[] {
  const bare = stories.filter(story => !hasCover(story));
  if (!bare.length || bare.length === stories.length) return stories;
  return [...stories.filter(hasCover), ...bare];
}

/**
 * Uzun, sayfa sayfa büyüyen listeler için kapak sıralaması: sıra
 * `COVER_BLOCK`luk bloklara kesilir ve kapaksızlar her bloğun sonuna iner.
 *
 * Blok blok olmasının sebebi kararlılık: listenin tamamına tek bir kapak
 * sıralaması uygulansaydı, yeni sayfa geldiğinde içindeki kapaklı kartlar
 * yukarı sıçrayıp okurun o an baktığı kartların yerini değiştirirdi.
 */
export function coverLastInBlocks(stories: Story[], blockSize = COVER_BLOCK): Story[] {
  if (stories.length <= blockSize) return coverLast(stories);
  const ordered: Story[] = [];
  for (let start = 0; start < stories.length; start += blockSize) {
    ordered.push(...coverLast(stories.slice(start, start + blockSize)));
  }
  return ordered;
}

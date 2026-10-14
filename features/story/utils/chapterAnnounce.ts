import type { Story } from '@/types';

export type AnnounceInput = {
  current: Pick<Story, 'isPublished' | 'chaptersCount' | 'announcedChaptersCount'>;
  updates: Partial<Pick<Story, 'isPublished' | 'chaptersCount'>>;
  /** Stüdyo açılışında alınan temel; otomatik kayıt dokümandaki değeri bozar. */
  announcedBefore?: number;
};

export type AnnounceDecision = {
  /** Duyuru uygulandıktan sonra dokümana yazılacak bölüm sayısı. */
  chapterCount: number;
  /** Taslak → yayın geçişi: hikâyenin kendisi duyurulur. */
  becamePublished: boolean;
  /** Yayındaki hikâyeye yeni bölüm: bölüm duyurulur. */
  chapterAdded: boolean;
};

/**
 * Takipçilere ne duyurulacağını belirler.
 *
 * Eskiden yalnızca `chaptersCount` artışına bakılıyordu; stüdyo otomatik
 * kaydı (800 ms) bu alanı yazdığı için yazar yeni bölümün ilk harfini
 * yazarken takipçilere boş bölüm bildirimi gidiyordu. Artık karşılaştırma
 * DUYURULMUŞ bölüm sayısına göre yapılır — böylece bölüm silip yeniden
 * eklemek de ikinci bir bildirim üretmez.
 */
export function decideAnnouncement({
  current,
  updates,
  announcedBefore,
}: AnnounceInput): AnnounceDecision {
  const chapterCount = typeof updates.chaptersCount === 'number'
    ? updates.chaptersCount
    : current.chaptersCount || 1;
  const becamePublished = updates.isPublished === true && !current.isPublished;
  const announcedBase = announcedBefore
    ?? current.announcedChaptersCount
    ?? (current.isPublished ? current.chaptersCount || 1 : 0);

  return {
    chapterCount,
    becamePublished,
    chapterAdded: !becamePublished
      && !!current.isPublished
      && updates.isPublished !== false
      && chapterCount > announcedBase,
  };
}

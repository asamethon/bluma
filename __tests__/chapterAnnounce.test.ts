import { decideAnnouncement } from '@/features/story/utils/chapterAnnounce';

const published = (chaptersCount: number, announcedChaptersCount?: number) => ({
  isPublished: true,
  chaptersCount,
  announcedChaptersCount,
});

describe('decideAnnouncement', () => {
  it('taslak yayına geçince hikâyeyi duyurur', () => {
    const decision = decideAnnouncement({
      current: { isPublished: false, chaptersCount: 1 },
      updates: { isPublished: true, chaptersCount: 1 },
    });
    expect(decision).toMatchObject({ becamePublished: true, chapterAdded: false, chapterCount: 1 });
  });

  it('yayındaki hikâyeye eklenen bölüm duyurulabilir sayılır', () => {
    // Stüdyo açılışında 1 bölüm duyurulmuştu; yazar ikincisini ekledi.
    // Karar yalnızca "duyurulabilir" der — izni veren tek yer açık
    // "Yayınla" aksiyonudur (bkz. UpdateStoryOptions.announce).
    const decision = decideAnnouncement({
      current: published(2, 1),
      updates: { chaptersCount: 2 },
      announcedBefore: 1,
    });
    expect(decision.chapterAdded).toBe(true);
    expect(decision.chapterCount).toBe(2);
  });

  it('duyurulmuş bölüm yeniden duyurulmaz', () => {
    const decision = decideAnnouncement({
      current: published(2, 2),
      updates: { chaptersCount: 2 },
    });
    expect(decision.chapterAdded).toBe(false);
  });

  it('bölüm silip yeniden eklemek ikinci bildirim üretmez', () => {
    // 5 bölüm duyuruldu, biri silindi (4), yenisi eklendi (5).
    const decision = decideAnnouncement({
      current: published(4, 5),
      updates: { chaptersCount: 5 },
    });
    expect(decision.chapterAdded).toBe(false);
  });

  it('alanı olmayan eski hikâyede temel değer açılışta alınandır', () => {
    // Otomatik kayıt dokümandaki sayıyı 6'ya çıkarmış olsa da, açılışta
    // duyurulmuş sayı 5'ti: 6. bölüm duyurulabilir.
    const decision = decideAnnouncement({
      current: published(6),
      updates: { chaptersCount: 6 },
      announcedBefore: 5,
    });
    expect(decision.chapterAdded).toBe(true);
  });

  it('alan ve temel değer yoksa geçmiş bölümler duyurulmuş sayılır', () => {
    const decision = decideAnnouncement({
      current: published(6),
      updates: { chaptersCount: 6 },
    });
    expect(decision.chapterAdded).toBe(false);
  });

  it('yayından çekilen hikâye bölüm duyurusu yapmaz', () => {
    const decision = decideAnnouncement({
      current: published(2, 1),
      updates: { isPublished: false, chaptersCount: 3 },
    });
    expect(decision.chapterAdded).toBe(false);
    expect(decision.becamePublished).toBe(false);
  });
});

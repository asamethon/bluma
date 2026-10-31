import i18n from '@/i18n';
import { isAbandonedDraft, isUntitledTitle } from '@/features/story/utils/draftState';
import { defaultChapterTitle } from '@/features/story/utils/chapterContent';

const untitled = () => i18n.getFixedT('tr')('studio.untitledStory');
const draft = (data = {}) => ({ isPublished: false, title: untitled(), description: '', coverImage: undefined, ...data });
const empty = () => [{ id: '1', title: defaultChapterTitle(1), content: '  \n ' }];

describe('boş bırakılan taslak', () => {
  it('her dildeki "Adsız hikâye" başlığını tanır', () => {
    expect(isUntitledTitle(i18n.getFixedT('en')('studio.untitledStory'))).toBe(true);
    expect(isUntitledTitle(i18n.getFixedT('tr')('studio.untitledStory'))).toBe(true);
    expect(isUntitledTitle('Karanlık Orman')).toBe(false);
  });

  it('hiçbir şey yazılmamış hızlı taslak silinebilir', () => {
    expect(isAbandonedDraft(draft(), empty())).toBe(true);
  });

  it('metni, adı, açıklaması, kapağı ya da bölüm adı olan taslağa dokunulmaz', () => {
    expect(isAbandonedDraft(draft(), [{ id: '1', title: defaultChapterTitle(1), content: 'Bir varmış' }])).toBe(false);
    expect(isAbandonedDraft(draft({ title: 'Karanlık Orman' }), empty())).toBe(false);
    expect(isAbandonedDraft(draft({ description: 'Özet' }), empty())).toBe(false);
    expect(isAbandonedDraft(draft({ coverImage: 'https://ornek/kapak.jpg' }), empty())).toBe(false);
    expect(isAbandonedDraft(draft(), [{ id: '1', title: 'Başlangıç', content: '' }])).toBe(false);
    expect(isAbandonedDraft(draft({ isPublished: true }), empty())).toBe(false);
    expect(isAbandonedDraft(null, empty())).toBe(false);
  });
});

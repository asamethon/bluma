import { extractMentions } from '@/features/story/services/commentMentions';

jest.mock('@react-native-firebase/firestore', () => ({}));
jest.mock('@/store/notificationStore', () => ({ notificationActions: {} }));
jest.mock('@/utils/logger', () => ({ logger: { debug: jest.fn() } }));

describe('yorumdaki anmalar', () => {
  it('tekil kullanıcı adlarını sırayla ve küçük harfle verir', () => {
    expect(extractMentions('@Ayse harika! @mehmet_1 sen de bak, @ayse')).toEqual(['ayse', 'mehmet_1']);
  });
  it('e-posta adreslerini ve yalnız @ işaretini anma saymaz', () => {
    expect(extractMentions('yaz: ali@ornek.com ya da @ tek başına')).toEqual([]);
  });
  it('en fazla üç kişi bildirilir', () => {
    expect(extractMentions('@aa @bb @cc @dd @ee')).toEqual(['aa', 'bb', 'cc']);
  });
  it('satır başında ve noktalamadan sonra da yakalar', () => {
    expect(extractMentions('@ilk\n(@ikinci) "@ucuncu"')).toEqual(['ilk', 'ikinci', 'ucuncu']);
  });
});

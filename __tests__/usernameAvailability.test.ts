import { checkUsernameAvailability } from '@/features/auth/services/profile/usernameAvailability';
import { pickAvailableUsernames } from '@/features/profile/services/usernameSuggestions';

// Servis yalnızca sıra ve sorgu bütçesini yönetir; Firestore erişimi
// mock'lanır (bkz. providerProfile.test.ts aynı kalıp).
jest.mock('@/features/auth/services/profile/usernameAvailability', () => ({
  checkUsernameAvailability: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('pickAvailableUsernames', () => {
  const takenAll = async () => false;
  const freeAll = async () => true;

  it('ilk 2 müsait adayı döndürür', async () => {
    const result = await pickAvailableUsernames(['a1', 'a2', 'a3'], { isAvailable: freeAll });
    expect(result).toEqual(['a1', 'a2']);
  });

  it('2 müsait aday bulunca sorguyu keser', async () => {
    const asked: string[] = [];
    await pickAvailableUsernames(['a1', 'a2', 'a3'], {
      isAvailable: async username => (asked.push(username), true),
    });
    expect(asked).toEqual(['a1', 'a2']);
  });

  it('dolu adayları atlar', async () => {
    const result = await pickAvailableUsernames(['dolu', 'bos', 'dolu2'], {
      isAvailable: async username => username === 'bos',
    });
    expect(result).toEqual(['bos']);
  });

  it('en fazla 3 sorgu yapar', async () => {
    const asked: string[] = [];
    await pickAvailableUsernames(['a1', 'a2', 'a3', 'a4', 'a5'], {
      isAvailable: async username => (asked.push(username), false),
    });
    expect(asked).toEqual(['a1', 'a2', 'a3']);
  });

  it('hepsi doluysa ilk adaya iki haneli sayı ekler', async () => {
    const result = await pickAvailableUsernames(['gokceyilmaz', 'gokce_yilmaz'], {
      isAvailable: takenAll,
      suffix: () => 42,
    });
    expect(result).toEqual(['gokceyilmaz42']);
  });

  it('sayı eklerken 30 karakter sınırını korur', async () => {
    const result = await pickAvailableUsernames(['abdulhamitsuleymancagatayyildi'], {
      isAvailable: takenAll,
      suffix: () => 42,
    });
    expect(result).toEqual(['abdulhamitsuleymancagatayyil42']);
    expect(result[0].length).toBeLessThanOrEqual(30);
  });

  it('aday yoksa boş döner ve sorgu yapmaz', async () => {
    const asked: string[] = [];
    const result = await pickAvailableUsernames([], {
      isAvailable: async username => (asked.push(username), true),
    });
    expect(result).toEqual([]);
    expect(asked).toEqual([]);
  });

  it('varsayılan sayı iki hanelidir', async () => {
    const [result] = await pickAvailableUsernames(['okur'], { isAvailable: takenAll });
    expect(result).toMatch(/^okur\d{2}$/);
  });
});

describe('pickAvailableUsernames varsayılan kontrol', () => {
  it('checkUsernameAvailability servisine düşer', async () => {
    jest.mocked(checkUsernameAvailability).mockResolvedValue(true);
    const result = await pickAvailableUsernames(['gokce', 'gokce_yilmaz']);
    expect(result).toEqual(['gokce', 'gokce_yilmaz']);
    expect(checkUsernameAvailability).toHaveBeenCalledTimes(2);
  });
});

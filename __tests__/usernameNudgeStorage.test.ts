import AsyncStorage from '@react-native-async-storage/async-storage';
import { readNudgeDismissed, writeNudgeDismissed } from '@/features/profile/services/usernameNudgeStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('usernameNudgeStorage', () => {
  it('anahtarı uid\'e bağlar — aynı cihazdaki başka hesap etkilenmez', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    await readNudgeDismissed('user-1');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('bluma.usernameNudgeDismissed.user-1');

    await writeNudgeDismissed('user-2');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('bluma.usernameNudgeDismissed.user-2', 'true');
  });

  it('kapatılmış kararı okur', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('true');
    expect(await readNudgeDismissed('user-1')).toBe(true);
  });

  it('karar yoksa kart gösterilebilir', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    expect(await readNudgeDismissed('user-1')).toBe(false);
  });

  it('okuma hata verirse kart GÖSTERİLMEZ (ısrar etmemek yeğdir)', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('disk'));
    expect(await readNudgeDismissed('user-1')).toBe(true);
  });

  it('yazma hatası akışı bozmaz', async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('disk'));
    await expect(writeNudgeDismissed('user-1')).resolves.toBeUndefined();
  });
});

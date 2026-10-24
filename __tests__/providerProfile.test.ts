import { getDoc } from '@react-native-firebase/firestore';
import { upsertProviderProfile } from '@/features/auth/services/providerProfile';
import { saveUserProfile } from '@/features/auth/services/profileRepository';
import { readCachedSession } from '@/features/auth/services/sessionStorage';
import { trackSignupContext } from '@/features/auth/services/signupContext';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(), doc: jest.fn(), getDoc: jest.fn(),
}));
jest.mock('@/features/auth/services/profileRepository', () => ({ saveUserProfile: jest.fn() }));
jest.mock('@/features/auth/services/sessionStorage', () => ({ readCachedSession: jest.fn() }));
jest.mock('@/features/auth/services/signupContext', () => ({
  buildSignupContext: () => ({ signupPlatform: 'ios', signupRegion: 'TR' }),
  trackSignupContext: jest.fn(),
}));
jest.mock('@/utils/logger', () => ({ logger: { debug: jest.fn(), warn: jest.fn() } }));

const identity = { email: 'current@example.com', displayName: 'Yazar', authProvider: 'email' as const };
const profile = {
  id: 'writer', ...identity, email: 'old@example.com', username: 'yazar',
  interests: ['fantastik'], bio: 'Kayıtlı biyografi', followersCount: 12,
};
const snapshot = (data?: object) => ({ data: () => data }) as Awaited<ReturnType<typeof getDoc>>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getDoc).mockResolvedValue(snapshot(profile));
  jest.mocked(saveUserProfile).mockResolvedValue(undefined);
  jest.mocked(readCachedSession).mockResolvedValue(null);
});

it('yazma reddedilince okunmuş kullanıcı adı, ilgi alanları ve biyografi korunur', async () => {
  jest.mocked(saveUserProfile).mockRejectedValue({ code: 'firestore/permission-denied' });
  const result = await upsertProviderProfile('writer', identity);
  expect(result).toEqual({ user: { ...profile, ...identity }, isNew: false });
  expect(saveUserProfile).toHaveBeenCalledWith({ id: 'writer', ...identity });
});

it('okuma başarısızsa aynı hesaba ait tam önbellek kullanılır', async () => {
  jest.mocked(getDoc).mockRejectedValue({ code: 'firestore/unavailable' });
  jest.mocked(readCachedSession).mockResolvedValue({ user: profile, hasCompletedOnboarding: true });
  expect((await upsertProviderProfile('writer', identity)).user).toEqual({ ...profile, ...identity });
  expect(saveUserProfile).not.toHaveBeenCalled();
});

it('başka hesabın önbelleği giriş yapan kullanıcıya taşınmaz', async () => {
  jest.mocked(getDoc).mockRejectedValue({ code: 'firestore/unavailable' });
  jest.mocked(readCachedSession).mockResolvedValue({ user: profile, hasCompletedOnboarding: true });
  expect((await upsertProviderProfile('another', identity)).user).toEqual({ id: 'another', ...identity });
});

it('yeni profil yazılamazsa başarılı kayıt sonucu üretilmez', async () => {
  jest.mocked(getDoc).mockResolvedValue(snapshot());
  const error = { code: 'firestore/permission-denied' };
  jest.mocked(saveUserProfile).mockRejectedValue(error);
  await expect(upsertProviderProfile('writer', identity)).rejects.toBe(error);
  expect(trackSignupContext).not.toHaveBeenCalled();
});

it('yeni hesap yalnızca profil kaydı tamamlandıktan sonra yeni sayılır', async () => {
  jest.mocked(getDoc).mockResolvedValue(snapshot());
  const result = await upsertProviderProfile('writer', identity);
  expect(result.isNew).toBe(true);
  expect(saveUserProfile).toHaveBeenCalledWith(expect.objectContaining({ id: 'writer', signupRegion: 'TR' }), true);
  expect(trackSignupContext).toHaveBeenCalledTimes(1);
});

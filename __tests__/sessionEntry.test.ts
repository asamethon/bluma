import { sessionEntryRoute } from '@/features/auth/services/sessionEntry';

const pending = { isLoading: true, isAuthenticated: false, isGuest: false, hasCompletedOnboarding: false };

it('giriş tamamlanınca arka plan yükleme bayrağı yönlendirmeyi engellemez', () => {
  expect(sessionEntryRoute({ ...pending, isAuthenticated: true, hasCompletedOnboarding: true })).toBe('/(tabs)');
});

it('profili tamamlanmamış kullanıcı onboarding ekranına gider', () => {
  expect(sessionEntryRoute({ ...pending, isAuthenticated: true })).toBe('/(auth)/onboarding');
});

it('misafir oturumu yükleme bayrağından bağımsız açılır', () => {
  expect(sessionEntryRoute({ ...pending, isGuest: true })).toBe('/(tabs)');
});

it('henüz bilinmeyen oturum bekler, çıkış tamamlanınca karşılama açılır', () => {
  expect(sessionEntryRoute(pending)).toBeNull();
  expect(sessionEntryRoute({ ...pending, isLoading: false })).toBe('/(auth)/walkthrough');
});

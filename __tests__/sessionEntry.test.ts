import { sessionEntryRoute } from '@/features/auth/services/sessionEntry';

const pending = {
  isLoading: true,
  sessionResolved: false,
  isAuthenticated: false,
  isGuest: false,
  hasCompletedOnboarding: false,
};
const settled = { ...pending, isLoading: false, sessionResolved: true };

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
  expect(sessionEntryRoute(settled)).toBe('/(auth)/walkthrough');
});

it('native katman cevap vermediyse karşılama ekranı açılmaz', () => {
  // Yükleme bitti ama oturum sorusu cevaplanmadı: kullanıcı karşılama ekranını
  // görüp saniyeler sonra ana sayfaya zıplamamalı.
  expect(sessionEntryRoute({ ...settled, sessionResolved: false })).toBeNull();
});

it('oturum kesinleşince gecikmeli gelen kullanıcı doğrudan uygulamaya girer', () => {
  expect(sessionEntryRoute({ ...settled, isAuthenticated: true, hasCompletedOnboarding: true }))
    .toBe('/(tabs)');
});

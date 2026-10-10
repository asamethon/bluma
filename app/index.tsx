import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const isLoading = useAppSelector(s => s.auth.isLoading);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const hasCompletedOnboarding = useAppSelector(s => s.auth.hasCompletedOnboarding);
  const isGuest = useAppSelector(s => s.auth.isGuest);

  // Oturum henüz çözülmedi: yönlendirme yapılırsa önce walkthrough'a atlayıp
  // sonra geri dönerdi. Perde zaten üstte, boş dönmek güvenli.
  if (isLoading) return null;
  if (isGuest) return <Redirect href="/(tabs)" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/walkthrough" />;
  if (!hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
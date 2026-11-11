type EntryState = {
  isLoading: boolean;
  sessionResolved: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasCompletedOnboarding: boolean;
};

export function sessionEntryRoute(state: EntryState) {
  if (state.isGuest) return '/(tabs)' as const;
  if (state.isAuthenticated) {
    return state.hasCompletedOnboarding ? '/(tabs)' as const : '/(auth)/onboarding' as const;
  }
  // Giriş sonrası önbellek yazımının bitmesini beklemek ekranı boş bırakmamalı.
  if (state.isLoading) return null;
  // Oturum sorusu henüz cevaplanmadıysa karşılama ekranı AÇILMAZ: açılsa,
  // oturum birkaç yüz ms sonra gelince ekran kullanıcının altından kayıyor.
  return state.sessionResolved ? '/(auth)/walkthrough' as const : null;
}

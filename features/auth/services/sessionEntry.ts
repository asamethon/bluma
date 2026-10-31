type EntryState = {
  isLoading: boolean;
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
  return state.isLoading ? null : '/(auth)/walkthrough' as const;
}

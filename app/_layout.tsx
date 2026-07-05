import { authActions } from '@/store/authStore';
import { storyActions } from '@/store/storyStore';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { configureGoogleSignIn } from '@/config/googleSignIn';
import { AuthGateSheet } from '@/components/AuthGateSheet';
import { GuestProvider } from '@/contexts/GuestContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Provider } from 'react-redux';
import {
  useFonts,
  Spectral_400Regular,
  Spectral_400Regular_Italic,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
} from '@expo-google-fonts/spectral';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

// GoogleSignin.configure() en erken, uygulama açılışında bir kez çağrılmalı —
// çağrılmadan signIn() denenirse native SDK "No active configuration"
// hatası veriyordu (Google ile giriş hiç çalışmıyordu).
configureGoogleSignIn();

export default function RootLayout() {
  // useAppSelector kullanan iç bileşen Provider'ın altında olmalı.
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Spectral_400Regular,
    Spectral_400Regular_Italic,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });
  const isLoading = useAppSelector(s => s.auth.isLoading);
  const storiesLoaded = useAppSelector(s => s.story.storiesLoaded);
  const [splashTimedOut, setSplashTimedOut] = useState(false);
  const pathname = usePathname();

  // Ekran görüntüleme takibi — DAU/retention oturumlardan otomatik gelir,
  // bu event hangi ekranların kullanıldığını gösterir.
  useEffect(() => {
    if (!pathname) return;
    // logScreenView() dahili olarak hâlâ eski (deprecated) native metodu
    // çağırıyor ve konsola uyarı basıyor — 'screen_view' event'ini doğrudan
    // logEvent() ile göndermek RNFirebase'in önerdiği (uyarısız) yol.
    logEvent(getAnalytics(), 'screen_view', { screen_name: pathname, screen_class: pathname })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    authActions.initializeAuth();
    // Prefetch the public stories feed during the splash so screens render
    // with data already in the store instead of flashing an empty state.
    storyActions.setupStoriesListener();
    // Safety net: never hold the splash longer than this even if the feed is
    // slow or the device is offline.
    const t = setTimeout(() => setSplashTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Ready once fonts + auth are done AND the stories feed has loaded (or we
  // hit the timeout fallback).
  const ready = loaded && !isLoading && (storiesLoaded || splashTimedOut);

  // Hide the native splash only after the root view has laid out, so it stays
  // up until the first frame is painted — no black flash between splash and app.
  const onLayoutRootView = useCallback(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: '#2A1B52' }}
      onLayout={onLayoutRootView}
    >
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <BottomSheetModalProvider>
            <GuestProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
              <AuthGateSheet />
            </GuestProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

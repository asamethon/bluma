import '@/i18n';
import { authActions } from '@/store/authStore';
import { storyActions } from '@/store/storyStore';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { Image } from 'expo-image';
import { configureGoogleSignIn } from '@/config/googleSignIn';
import { initSentry } from '@/config/sentry';
import * as Sentry from '@sentry/react-native';
import { AuthGateSheet } from '@/components/AuthGateSheet';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SplashAnimation } from '@/components/ui';
import { GuestProvider } from '@/contexts/GuestContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
  usePathname,
} from "expo-router";
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
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

configureGoogleSignIn();
initSentry();

function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}

export default Sentry.wrap(RootLayout);

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
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const userId = useAppSelector(s => s.auth.user?.id);
  const storiesLoaded = useAppSelector(s => s.story.storiesLoaded);
  const continueReadingLoaded = useAppSelector(s => s.story.continueReadingLoaded);
  const stories = useAppSelector(s => s.story.stories);
  const continueReading = useAppSelector(s => s.story.continueReading);
  const [splashTimedOut, setSplashTimedOut] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    logEvent(getAnalytics(), 'screen_view', { screen_name: pathname, screen_class: pathname })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    authActions.initializeAuth();
    storyActions.setupStoriesListener();
    // "Kaç gündür kullanıyor" ölçümünü başlatır (değerlendirme eşiği için).
    reviewPromptActions.init().catch(() => {});
    const t = setTimeout(() => setSplashTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (userId && !isGuest) readingProgressActions.loadContinueReadingShelf();
  }, [userId, isGuest]);
  const continueReadingReady = isGuest || !userId || continueReadingLoaded;

  useEffect(() => {
    if (!storiesLoaded || !continueReadingReady) return;
    const uris = Array.from(new Set([
      ...continueReading.map(c => c.story.coverImage),
      ...stories.slice(0, 12).map(s => s.coverImage),
    ].filter((uri): uri is string => !!uri)));

    let cancelled = false;
    Promise.all(uris.map(uri => Image.prefetch(uri).catch(() => false)))
      .finally(() => { if (!cancelled) setImagesReady(true); });
    return () => { cancelled = true; };
  }, [storiesLoaded, continueReadingReady, stories, continueReading]);

  const dataReady = loaded && !isLoading &&
    (splashTimedOut || (storiesLoaded && continueReadingReady && imagesReady));
  const bootReady = dataReady && introFinished;
  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    if (bootReady) setAppReady(true);
  }, [bootReady]);

  const onLayoutRootView = useCallback(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
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
            <ErrorBoundary>
              {appReady ? (
                <GuestProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                  <AuthGateSheet />
                </GuestProvider>
              ) : (
                <SplashAnimation onFinish={() => setIntroFinished(true)} />
              )}
            </ErrorBoundary>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

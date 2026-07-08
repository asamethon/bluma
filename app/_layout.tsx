import { authActions } from '@/store/authStore';
import { storyActions } from '@/store/storyStore';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { Image } from 'expo-image';
import { configureGoogleSignIn } from '@/config/googleSignIn';
import { initSentry } from '@/config/sentry';
import * as Sentry from '@sentry/react-native';
import { AuthGateSheet } from '@/components/AuthGateSheet';
import { SplashAnimation } from '@/components/ui';
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
initSentry();

function RootLayout() {
  // useAppSelector kullanan iç bileşen Provider'ın altında olmalı.
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}

// Sentry.wrap: navigasyon breadcrumb'ları + otomatik boot-time performans
// izlemesi ekler. DSN yoksa initSentry() no-op kaldığından bunun da bir
// etkisi olmaz.
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

  // Girişli kullanıcı için "Okumaya Devam Et" rafını da splash sırasında
  // önden yükle — aksi halde ana sayfa açılınca bu bölüm birkaç saniye
  // sonra "patlayarak" beliriyordu (bkz. loadContinueReadingShelf).
  useEffect(() => {
    if (userId && !isGuest) readingProgressActions.loadContinueReadingShelf();
  }, [userId, isGuest]);
  const continueReadingReady = isGuest || !userId || continueReadingLoaded;

  // İlk ekranda görünecek hikaye kapaklarını (akış + okumaya devam et rafı)
  // splash kapanmadan önce prefetch et — aksi halde her kart kendi ağ
  // isteğini bekleyip teker teker "patlayarak" beliriyordu.
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

  // Data ready once fonts + auth are done AND the stories feed + continue-reading
  // shelf + their cover images have all loaded (or we hit the timeout
  // fallback). The app only hands off from the splash animation to real
  // screens once BOTH data is ready and our brand animation has played its
  // minimum duration — whichever finishes last.
  const dataReady = loaded && !isLoading &&
    (splashTimedOut || (storiesLoaded && continueReadingReady && imagesReady));
  const bootReady = dataReady && introFinished;
  // appReady tek yönlü latch: cold-boot'ta bir kez true olduysa isLoading
  // tekrar true olsa bile splash'e geri DÖNMEZ. Aksi halde signup / sign-in /
  // onboarding-complete gibi akışlarda ekilen isLoading=true, tüm (auth)
  // ağacını unmount edip splash'i geri getirir; akış bittiğinde Stack fresh
  // remount olurken signup'ın <Redirect href="/(auth)/onboarding">'i
  // navigation state resetlenmesiyle kayboluyor ve kullanıcı onboarding
  // yerine tabs'e düşüyordu (kayıt sonrası onboarding gelmeme bug'ı).
  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    if (bootReady) setAppReady(true);
  }, [bootReady]);

  // The native launch image only needs to stay up until fonts are loaded and
  // our own JS splash animation can paint with the right typography — from
  // that point on, the animation itself IS the splash the user sees, no
  // matter how long data takes to arrive.
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
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

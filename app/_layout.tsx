import '@/i18n';
import 'react-native-reanimated';

import { AuthGateSheet } from '@/features/auth/components/AuthGateSheet';
import ErrorBoundary from '@/components/ErrorBoundary';
import { BootSplash } from '@/features/bootstrap/components/BootSplash';
import { configureGoogleSignIn } from '@/config/googleSignIn';
import { initSentry } from '@/config/sentry';
import { GuestProvider } from '@/contexts/GuestContext';
import { useEmailVerificationAlert } from '@/features/auth/hooks/useEmailVerificationAlert';
import { useAppFonts } from '@/features/bootstrap/hooks/useAppFonts';
import { useBootSequence } from '@/features/bootstrap/hooks/useBootSequence';
import { useNavigationTheme } from '@/features/bootstrap/hooks/useNavigationTheme';
import { useNotificationRouting } from '@/features/bootstrap/hooks/useNotificationRouting';
import { useScreenTracking } from '@/features/bootstrap/hooks/useScreenTracking';
import { DeviceBannedScreen } from '@/features/moderation/components/DeviceBannedScreen';
import { useDeviceBan } from '@/features/moderation/hooks/useDeviceBan';
import { store } from '@/store';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

SplashScreen.preventAutoHideAsync();
configureGoogleSignIn();
initSentry();

/** Açılış ekranının arkasındaki koyu mor zemin (tema yüklenmeden önce görünür). */
const BOOT_BACKGROUND = '#2A1B52';

function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}

export default Sentry.wrap(RootLayout);

function RootLayoutInner() {
  const navigationTheme = useNavigationTheme();
  const fontsLoaded = useAppFonts();
  const { appReady, onIntroFinished } = useBootSequence(fontsLoaded);
  const deviceBan = useDeviceBan();
  useEmailVerificationAlert();
  useScreenTracking();
  useNotificationRouting();

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // Banlı cihazda uygulama hiç açılmaz; kurallar yazmayı zaten reddediyor,
  // buradaki ekran kullanıcıya sebebini söyler.
  if (deviceBan.ban) return <DeviceBannedScreen reason={deviceBan.ban.reason} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BOOT_BACKGROUND }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            <ErrorBoundary>
              {/* Ağaç açılış perdesinin ARKASINDA kurulur: perde kalktığında
                  ana ekran çizilmiş olur, arada boş bir kare kalmaz. */}
              <GuestProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
                <AuthGateSheet />
              </GuestProvider>
              <BootSplash visible={!appReady} onIntroFinished={onIntroFinished} />
            </ErrorBoundary>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { initNetworkStatus } from '@/hooks/useNetworkStatus';
import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';

/** Açılış ekranının en fazla bekleyeceği süre. */
const SPLASH_TIMEOUT_MS = 3000;
/** Açılışta ön belleğe alınacak kapak sayısı. */
const PREFETCH_COUNT = 12;

/**
 * Açılış akışı: oturum + akış dinleyicileri, ilk kapakların ön yüklemesi ve
 * "artık gösterebiliriz" kararı. Veri hazır olmasa da zaman aşımı devreye girer.
 */
export function useBootSequence(fontsLoaded: boolean) {
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const userId = useAppSelector(state => state.auth.user?.id);
  const storiesLoaded = useAppSelector(state => state.story.storiesLoaded);
  const continueReadingLoaded = useAppSelector(state => state.story.continueReadingLoaded);
  const stories = useAppSelector(state => state.story.stories);
  const continueReading = useAppSelector(state => state.story.continueReading);

  const [splashTimedOut, setSplashTimedOut] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Ağ durumu splash sırasında çözülsün ki arayüz açıldığında "çevrimdışı"
    // varsayımıyla bir kare bile render edilmesin.
    initNetworkStatus();
    authActions.initializeAuth();
    storyActions.setupStoriesListener();
    // "Kaç gündür kullanıyor" ölçümünü başlatır (değerlendirme eşiği için).
    reviewPromptActions.init().catch(() => {});
    const timer = setTimeout(() => setSplashTimedOut(true), SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userId && !isGuest) readingProgressActions.loadContinueReadingShelf();
  }, [userId, isGuest]);

  const continueReadingReady = isGuest || !userId || continueReadingLoaded;

  // Kapaklar ön belleğe alınır ama açılış ekranı BUNU BEKLEMEZ: ağaç zaten
  // perdenin arkasında kurulduğu için görseller o sırada yükleniyor.
  useEffect(() => {
    if (!storiesLoaded || !continueReadingReady) return;
    const uris = [...new Set([
      ...continueReading.map(entry => entry.story.coverImage),
      ...stories.slice(0, PREFETCH_COUNT).map(story => story.coverImage),
    ].filter((uri): uri is string => !!uri))];
    uris.forEach(uri => { void Image.prefetch(uri).catch(() => false); });
  }, [storiesLoaded, continueReadingReady, stories, continueReading]);

  const dataReady =
    fontsLoaded && !isLoading &&
    (splashTimedOut || (storiesLoaded && continueReadingReady));

  // Hazır olma durumu tek yönlüdür: sonradan gelen bir yükleme (ör. çıkış)
  // uygulamayı açılış ekranına geri döndürüp ağacı remount etmemeli.
  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    if (dataReady && introFinished) setAppReady(true);
  }, [dataReady, introFinished]);

  return { appReady, onIntroFinished: useCallback(() => setIntroFinished(true), []) };
}

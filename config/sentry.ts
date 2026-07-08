import * as Sentry from '@sentry/react-native';

// Crash/hata görünürlüğü (bkz. YAPILACAKLAR 3.3). DSN olmadan Sentry SDK'sı
// sessizce no-op olur (hiçbir şey göndermez, uygulamayı bozmaz) — bu yüzden
// DSN henüz eklenmemişken bu dosyayı import etmek güvenlidir.
//
// Kurulum: sentry.io → Settings → Projects → react-native → Client Keys
// (DSN) sayfasından DSN'i al, `.env` dosyasına ekle:
//   EXPO_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.log('Sentry DSN tanımlı değil — hata izleme devre dışı (bkz. config/sentry.ts).');
    return;
  }
  Sentry.init({
    dsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__, // Geliştirmede gürültü yapmasın; prod build'de aktif.
  });
}

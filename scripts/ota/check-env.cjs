// EAS env:exec içinde çalışır; .env yüklemek build/OTA farkını gizler.
for (const name of ['EXPO_PUBLIC_KLIPY_API_KEY', 'EXPO_PUBLIC_META_APP_ID', 'EXPO_PUBLIC_SENTRY_DSN']) {
  if (!process.env[name]?.trim()) throw new Error(`EAS ortamında ${name} eksik.`);
}
if (process.env.SENTRY_DISABLE_AUTO_UPLOAD === 'true') {
  throw new Error('SENTRY_DISABLE_AUTO_UPLOAD source map yüklemesini kapatmamalı.');
}
console.log('OTA ortam değişkenleri doğrulandı (değerler gizli).');

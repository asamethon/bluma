const { eas, easJson } = require('./eas.cjs');
const { assertChannel } = require('./guards.cjs');
const { existsSync } = require('node:fs');

if (existsSync('.env')) process.loadEnvFile('.env');
// Yetki hatasında hiçbir kaynak oluşturulmaz; mevcut proje kimliği değiştirilmez.
eas(['project:info'], true);
const channels = [];
for (let offset = 0; ; offset += 25) {
  const { currentPage } = easJson(['channel:list', '--limit', '25', '--offset', String(offset), '--non-interactive']);
  channels.push(...currentPage);
  if (currentPage.length < 25) break;
}
for (const name of ['development', 'preview', 'production-candidate', 'production']) {
  if (!channels.some(channel => channel.name === name)) {
    eas(['channel:create', name, '--non-interactive'], true);
    console.log(`${name} kanalı oluşturuldu.`);
  }
  const { currentPage } = easJson(['channel:view', name, '--non-interactive']);
  assertChannel(currentPage, name);
}

// Mevcut değerler ezilmez; yalnızca eksik istemci değişkenleri taşınır.
// EXPO_PUBLIC değerler uygulama paketinde zaten açıktır; auth token taşınmaz.
const missing = [];
for (const environment of ['development', 'preview', 'production']) {
  const existing = eas(['env:list', environment, '--format', 'short'], true);
  for (const name of ['EXPO_PUBLIC_KLIPY_API_KEY', 'EXPO_PUBLIC_META_APP_ID', 'EXPO_PUBLIC_SENTRY_DSN']) {
    if (new RegExp(`^${name}=`, 'm').test(existing)) continue;
    const value = process.env[name];
    if (!value) {
      missing.push(`${environment}: ${name}`);
      continue;
    }
    eas(['env:create', '--environment', environment, '--name', name, '--value', value,
      '--visibility', 'sensitive', '--non-interactive'], true);
    console.log(`${environment}: ${name} eklendi (değer gizli).`);
  }
  if (!missing.some(entry => entry.startsWith(`${environment}:`))) {
    eas(['env:exec', environment, 'node scripts/ota/check-env.cjs', '--non-interactive']);
  }
}
if (missing.length) throw new Error(`Eksik OTA ortam değişkenleri: ${missing.join(', ')}.`);
console.log('OTA kanalları ve ortamları hazır. İlk native build hâlâ gereklidir.');

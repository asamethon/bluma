const { spawnSync } = require('node:child_process');
const expo = require.resolve('expo/bin/cli');
const platform = process.argv[2];
if (!['ios', 'android'].includes(platform)) throw new Error('Platform ios veya android olmalı.');

const run = (args, local) => spawnSync(process.execPath, [expo, ...args], {
  stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_USE_FIREBASE_EMULATORS: local ? '1' : '0' },
});
const prebuild = ['prebuild', '--platform', platform, '--no-install'];
async function main() {
  const status = await fetch('http://127.0.0.1:8082/status', { signal: AbortSignal.timeout(2000) }).catch(() => null);
  if (!status?.ok) throw new Error('Önce ayrı terminalde yarn local:start çalıştırmalısın.');
  try {
    const prepared = run(prebuild, true);
    if (prepared.error) throw prepared.error;
    if (prepared.status !== 0) throw new Error('Yerel native yapılandırma hazırlanamadı.');
    const built = run([`run:${platform}`, '--port', '8082'], true);
    if (built.error) throw built.error;
    process.exitCode = built.status ?? 1;
  } finally {
    // Sonraki normal yarn ios/android çalıştırması tekrar ana uygulamayı derler.
    const restored = run(prebuild, false);
    if (restored.error || restored.status !== 0) {
      console.error('Native ayarları geri yüklemek için çalıştır: npx expo prebuild --platform', platform, '--no-install');
      process.exitCode = 1;
    }
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

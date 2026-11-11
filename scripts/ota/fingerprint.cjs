const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { root, run } = require('./eas.cjs');
const { assertStoreRuntime } = require('./guards.cjs');

/**
 * Mağazadaki binary'lerin runtime'ı. Build'ler yerelde (`eas build --local`)
 * alındığı için EAS'ın build listesi boş; tek doğru kaynak bu dosya.
 */
const STORE = join(root, 'scripts/ota/store-runtimes.json');
/** Build anındaki fingerprint dökümü: sapma olursa hangi paket değişti görülsün. */
const SNAPSHOTS = join(root, 'scripts/ota/fingerprints');

const platformsOf = platform => (platform === 'all' ? ['ios', 'android'] : [platform]);
const fingerprint = target =>
  JSON.parse(run('npx', ['expo-updates', 'fingerprint:generate', '--platform', target], true));

/**
 * Binary'ye giren girdiler: bağımlılıklar, yamalar, yerel modüller, ikon ve
 * Firebase dosyaları. Çözülmüş Expo yapılandırması ayrıca karşılaştırılır.
 */
const NATIVE_INPUTS = ['package.json', 'yarn.lock', 'plugins', 'modules', 'scripts/patchNativeDeps.cjs',
  '.fingerprintignore', 'GoogleService-Info.plist', 'google-services.json', 'assets'];

const sortKeys = value => (Array.isArray(value) ? value.map(sortKeys)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])])) : value);

/** Sabitleme değişkenleri kurulmadan çözülen yapılandırmanın özeti. */
function configHash() {
  const config = JSON.parse(run('npx', ['expo', 'config', '--json', '--type', 'public'], true));
  return createHash('sha256').update(JSON.stringify(sortKeys(config))).digest('hex');
}

function readStore() {
  return JSON.parse(readFileSync(STORE, 'utf8'));
}

/**
 * Yüklemeden ÖNCE: bu paket mağazadaki build'e inecek mi? İnmeyecekse hiçbir
 * şey yüklenmez. Üç kez runtime'ı tutmayan paket yüklenip ancak sonradan
 * fark edilmişti (dil ayarı, node_modules sapması).
 */
function assertMatchesStore(platform) {
  const store = readStore();
  mkdirSync(join(root, '.ota'), { recursive: true });
  for (const target of platformsOf(platform)) {
    const result = fingerprint(target);
    writeFileSync(join(root, '.ota', `fingerprint-${target}.json`), JSON.stringify(result, null, 2));
    assertStoreRuntime(target, result.hash, store);
    console.log(`${target} runtime mağazadaki ${store[target].build} ile aynı (${result.hash.slice(0, 8)}).`);
  }
}

/**
 * Kaçış kapağı: fingerprint sapmış ama binary'ye giren hiçbir şey mağaza
 * build'inden beri değişmemişse paket o build'in runtime'ına bağlanır.
 *
 * Neden var: 11 Kasım 2026'da node_modules yeniden kurulunca fingerprint
 * değişti; paket sürümleri, yarn.lock, yamalar ve yapılandırma birebir aynı
 * olduğu halde. Sapmanın kaynağı bulunamadı. Kontrol burada kesin: native
 * girdilerde tek satır değişmişse kapak açılmaz, yeni build gerekir.
 */
function pinStoreRuntime(platform) {
  const store = readStore();
  const config = configHash();
  for (const target of platformsOf(platform)) {
    const entry = store[target];
    assert.ok(entry?.runtime && entry.nativeCommit && entry.configHash,
      `${target} için sabitleme kaydı eksik (runtime, nativeCommit, configHash).`);
    const changed = run('git', ['diff', '--name-only', entry.nativeCommit, 'HEAD', '--', ...NATIVE_INPUTS], true).trim();
    assert.equal(changed, '', `${target}: ${entry.build} build'inden beri native girdiler değişmiş, yeni build gerekir:\n${changed}`);
    assert.equal(config, entry.configHash, `${target}: Expo yapılandırması ${entry.build} build'indekinden farklı, yeni build gerekir.`);
    process.env[`BLUMA_PIN_RUNTIME_${target.toUpperCase()}`] = entry.runtime;
    console.log(`${target}: native girdiler ${entry.build} ile aynı, paket ${entry.runtime.slice(0, 8)} runtime'ına bağlandı.`);
  }
}

/** Yeni native build mağazaya gönderilince çalıştırılır: runtime ve döküm kaydedilir. */
function recordBuild(platform, build) {
  const store = readStore();
  mkdirSync(SNAPSHOTS, { recursive: true });
  for (const target of platformsOf(platform)) {
    const result = fingerprint(target);
    writeFileSync(join(SNAPSHOTS, `${target}.json`), `${JSON.stringify(result, null, 2)}\n`);
    store[target] = {
      runtime: result.hash,
      build,
      nativeCommit: run('git', ['rev-parse', 'HEAD'], true).trim(),
      configHash: configHash(),
    };
    console.log(`${target}: ${build} → ${result.hash}`);
  }
  writeFileSync(STORE, `${JSON.stringify(store, null, 2)}\n`);
}

module.exports = { assertMatchesStore, configHash, pinStoreRuntime, readStore, recordBuild };

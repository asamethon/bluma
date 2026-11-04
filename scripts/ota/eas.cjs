const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');

const root = resolve(__dirname, '../..');
// Dil ayarı sabit: @expo/fingerprint dizinleri `localeCompare` ile sıralıyor.
// Türkçe terminalde (tr_TR) "I/ı/i" sıralaması değişip runtime farklı
// hesaplanıyor ve güncelleme mağazadaki build'lere hiç inmiyordu.
const env = {
  ...process.env, EXPO_NO_DOTENV: '1', CI: '1', FORCE_COLOR: '0',
  LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8',
};

function run(command, args, capture = false) {
  try {
    return execFileSync(command, args, {
      cwd: root, env, encoding: 'utf8',
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    // execFileSync hatası argv/stdout'u da içerir: env değerlerini asla loglamayın.
    const hidden = args.includes('--value') || args.includes('env:list');
    const details = hidden ? '' : `${error.stderr ?? ''}`.trim();
    throw new Error(`${command} işlemi başarısız (${error.status ?? 'bilinmiyor'}). ${details}`);
  }
}

function eas(args, capture = false) {
  return run('npx', ['--yes', 'eas-cli@24.12.1', ...args], capture);
}

// eas-cli bazen JSON'dan önce stdout'a uyarı satırı basıyor ("ignoring flag
// ..."). Çıktı ilk '{' ya da '[' karakterinden itibaren okunur.
function easJson(args) {
  const output = eas([...args, '--json'], true);
  const start = output.search(/^[[{]/m);
  if (start < 0) throw new Error(`eas JSON döndürmedi: ${output.slice(0, 200)}`);
  return JSON.parse(output.slice(start));
}

module.exports = { root, run, eas, easJson };

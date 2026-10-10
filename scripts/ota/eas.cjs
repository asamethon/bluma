const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');

const root = resolve(__dirname, '../..');
const env = { ...process.env, EXPO_NO_DOTENV: '1', CI: '1', FORCE_COLOR: '0' };

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

function easJson(args) {
  return JSON.parse(eas([...args, '--json'], true));
}

module.exports = { root, run, eas, easJson };

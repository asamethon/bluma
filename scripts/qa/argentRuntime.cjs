const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const version = '0.25.0';
const sessionFile = path.join(root, '.argent/session.local.json');

function resolveCli() {
  if (process.env.ARGENT_CLI) return checkCli(process.env.ARGENT_CLI);
  const candidates = [path.join(root, 'node_modules/@swmansion/argent/dist/cli.js')];
  const cache = path.join(os.homedir(), '.npm/_npx');
  if (fs.existsSync(cache)) {
    for (const entry of fs.readdirSync(cache)) {
      candidates.push(path.join(cache, entry, 'node_modules/@swmansion/argent/dist/cli.js'));
    }
  }
  for (const candidate of candidates) {
    try { return checkCli(candidate); } catch { /* Sonraki yerel kurulumu dene. */ }
  }
  throw new Error(`Argent ${version} yerelde bulunamadı. Kurulu dist/cli.js yolunu ARGENT_CLI ile ver.`);
}

function checkCli(cli) {
  const absolute = path.resolve(cli);
  const metadata = JSON.parse(fs.readFileSync(path.join(path.dirname(absolute), '../package.json'), 'utf8'));
  if (metadata.name !== '@swmansion/argent' || metadata.version !== version) {
    throw new Error(`Argent sürümü ${version} olmalı.`);
  }
  return absolute;
}

function session() {
  if (!fs.existsSync(sessionFile)) throw new Error('Önce yarn qa:ui use <iOS-simülatör-UDID> çalıştır.');
  const saved = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  return { ...saved, cli: resolveCli() };
}

function selectDevice(device) {
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(device || '')) {
    throw new Error('Bu test komutu iOS simülatörünün UDID değerini bekler.');
  }
  const cli = resolveCli();
  fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
  fs.writeFileSync(sessionFile, JSON.stringify({ device, bundleId: 'com.asamethon.bluma.local', version }, null, 2));
  return { device, bundleId: 'com.asamethon.bluma.local', cli };
}

function invoke(context, tool, args) {
  const flags = Object.entries(args).flatMap(([key, value]) => [
    `--${key}`, typeof value === 'object' ? JSON.stringify(value) : String(value),
  ]);
  try {
    const output = execFileSync(process.execPath, [context.cli, 'run', tool, ...flags], {
      cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(output);
  } catch (error) {
    // Komut metnini/parola içerebilen argümanları hata çıktısına kopyalama.
    try { return { ...JSON.parse(error.stdout), isError: true }; } catch { /* Metin hatası. */ }
    return { isError: true, error: String(error.stderr || error.code || 'Argent komutu tamamlanamadı.') };
  }
}

function save(tool, result) {
  const label = tool.replace(/[^a-z0-9_-]/gi, '-').slice(0, 64);
  const directory = path.join(root, '.argent/results', `${Date.now()}-${label}`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
  return directory;
}

module.exports = { root, session, selectDevice, invoke, save };

const assert = require('node:assert/strict');
const { writeFileSync, mkdirSync } = require('node:fs');
const { parseArgs } = require('node:util');
const { run, eas, easJson } = require('./eas.cjs');
const { assertGroup, assertBuild, assertChannel } = require('./guards.cjs');

const action = process.argv[2];
const { values: options } = parseArgs({
  args: process.argv.slice(3),
  options: Object.fromEntries(['channel', 'message', 'group', 'percentage', 'runtime', 'platform']
    .map(name => [name, { type: 'string' }])),
});
const platform = options.platform ?? 'all';
assert.ok(['all', 'ios', 'android'].includes(platform), 'Platform: all, ios veya android.');
const percentage = options.percentage ?? '10';
assert.ok(/^(?:[1-9]|[1-9]\d|100)$/.test(percentage), 'Yüzde 1–100 arası tam sayı olmalı.');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateChannel(name) {
  const { currentPage } = easJson(['channel:view', name, '--non-interactive']);
  assertChannel(currentPage, name);
}

function getGroup(branch) {
  assert.ok(uuid.test(options.group ?? ''), '--group ile güncelleme grubu UUID gerekli.');
  return assertGroup(easJson(['update:view', options.group]), {
    group: options.group, branch, platform,
  });
}

function validateProductionBuilds(updates) {
  for (const update of updates) {
    const builds = easJson(['build:list', '--channel', 'production', '--status', 'finished',
      '--runtime-version', update.runtimeVersion, '--platform', update.platform,
      '--limit', '1', '--non-interactive']);
    assertBuild(builds, update);
  }
}

function saveResult(result) {
  mkdirSync('.ota', { recursive: true });
  writeFileSync('.ota/release.json', JSON.stringify({
    action, commit: run('git', ['rev-parse', 'HEAD'], true).trim(),
    createdAt: new Date().toISOString(), result,
  }, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

function publish() {
  const channel = options.channel ?? 'preview';
  assert.ok(['preview', 'production-candidate'].includes(channel),
    'Doğrudan production yayını kapalı; test edilmiş grubu promote edin.');
  assert.ok(options.message?.trim(), '--message gerekli.');
  assert.equal(run('git', ['status', '--porcelain'], true).trim(), '',
    'Yayın için çalışma ağacı temiz olmalı; değişiklikleri commit edin.');
  run('node', ['scripts/ota/check-config.cjs']);
  run('yarn', ['run', 'check']);
  run('yarn', ['test', '--runInBand']);
  validateChannel(channel);
  const environment = channel === 'preview' ? 'preview' : 'production';
  eas(['env:exec', environment, 'node scripts/ota/check-env.cjs', '--non-interactive']);
  const upload = !!process.env.SENTRY_AUTH_TOKEN;
  if (channel === 'production-candidate') {
    for (const name of ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']) {
      assert.ok(process.env[name], `${name} gerekli; aday paketin source map'i izlenebilir olmalı.`);
    }
  }
  // Source map yüklemesi başarısızsa güncelleme henüz yayınlanmamıştır.
  eas(['env:exec', environment,
    'npx expo export --platform ios --platform android --output-dir dist --source-maps',
    '--non-interactive']);
  run('node', ['scripts/ota/check-export.cjs', 'dist']);
  if (upload) run('node', ['node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js', 'dist']);
  saveResult(easJson(['update', '--channel', channel, '--environment', environment,
    '--message', options.message, '--platform', platform,
    '--skip-bundler', '--input-dir', 'dist', '--emit-metadata', '--non-interactive']));
}

function republish(rollback) {
  const updates = getGroup(rollback ? 'production' : 'production-candidate');
  validateChannel('production');
  validateProductionBuilds(updates);
  assert.ok(options.message?.trim(), '--message gerekli.');
  const args = ['update:republish', '--group', options.group,
    '--destination-channel', 'production', '--platform', platform,
    '--message', options.message, '--rollout-percentage', rollback ? '100' : percentage,
    '--non-interactive'];
  if (rollback) args.push('--force-end-active-rollout');
  saveResult(easJson(args));
}

function rollout() {
  assert.equal(platform, 'all', 'Rollout yüzdesi tüm gruba uygulanır.');
  getGroup('production');
  validateChannel('production');
  saveResult(easJson(['update:edit', options.group, '--rollout-percentage', percentage,
    '--non-interactive']));
}

function embedded() {
  assert.ok(options.runtime?.trim(), '--runtime gerekli.');
  assert.ok(options.message?.trim(), '--message gerekli.');
  validateChannel('production');
  validateProductionBuilds((platform === 'all' ? ['ios', 'android'] : [platform])
    .map(target => ({ platform: target, runtimeVersion: options.runtime })));
  saveResult(easJson(['update:roll-back-to-embedded', '--channel', 'production',
    '--runtime-version', options.runtime, '--platform', platform, '--message', options.message,
    '--force-end-active-rollout', '--non-interactive']));
}

const commands = { publish, promote: () => republish(false), rollout,
  rollback: () => republish(true), embedded };
assert.ok(Object.hasOwn(commands, action), 'İşlem: publish, promote, rollout, rollback, embedded.');
commands[action]();

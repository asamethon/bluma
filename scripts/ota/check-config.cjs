const assert = require('node:assert/strict');
const app = require('../../app.json').expo;
const eas = require('../../eas.json');
const pkg = require('../../package.json');

assert.equal(app.updates.url, `https://u.expo.dev/${app.extra.eas.projectId}`);
assert.deepEqual(app.runtimeVersion, { policy: 'fingerprint' });
assert.equal(app.updates.enabled, true);
assert.equal(app.updates.checkAutomatically, 'ON_ERROR_RECOVERY');
assert.equal(app.updates.fallbackToCacheTimeout, 0);
assert.equal(app.updates.useEmbeddedUpdate, true);
assert.notEqual(app.updates.disableAntiBrickingMeasures, true);
assert.ok(pkg.dependencies['expo-updates']);
const sentry = app.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo');
assert.ok(sentry?.[1]?.organization && sentry?.[1]?.project, 'Sentry native proje bilgileri gerekli.');

for (const profile of ['development', 'preview', 'production']) {
  assert.equal(eas.build[profile].channel, profile);
  assert.equal(eas.build[profile].environment, profile);
  assert.ok(!eas.build[profile].env?.EXPO_PUBLIC_KLIPY_API_KEY,
    'Build ve OTA aynı EAS ortam değişkenlerini kullanmalı.');
  assert.notEqual(eas.build[profile].env?.SENTRY_DISABLE_AUTO_UPLOAD, 'true',
    'Native source map yüklemesi kapalı olmamalı.');
}
const candidate = eas.build['production-candidate'];
assert.equal(candidate.extends, 'production');
assert.equal(candidate.channel, 'production-candidate');
assert.ok(!candidate.environment || candidate.environment === 'production');
console.log('OTA yapılandırması doğrulandı.');

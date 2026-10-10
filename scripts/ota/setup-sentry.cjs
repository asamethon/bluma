const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');

if (existsSync('.env')) process.loadEnvFile('.env');
// Yerel kurulumda token yalnızca çocuğun ortamında ve EAS sensitive alanında yaşar.
const { eas } = require('./eas.cjs');
const token = process.env.SENTRY_AUTH_TOKEN;
assert.ok(token?.startsWith('sntrys_'), 'SENTRY_AUTH_TOKEN bir Sentry Organization Token olmalı.');
eas(['project:info'], true);
for (const environment of ['development', 'preview', 'production']) {
  const existing = eas(['env:list', environment, '--format', 'short'], true);
  if (/^SENTRY_AUTH_TOKEN=/m.test(existing)) {
    console.log(`${environment}: Sentry token mevcut; değiştirilmedi.`);
    continue;
  }
  eas(['env:create', '--environment', environment, '--name', 'SENTRY_AUTH_TOKEN',
    '--value', token, '--visibility', 'sensitive', '--non-interactive'], true);
  console.log(`${environment}: Sentry build token eklendi (değer gizli).`);
}

const assert = require('node:assert/strict');
const { readFileSync, statSync } = require('node:fs');
const { resolve, relative, isAbsolute } = require('node:path');

const output = resolve(process.argv[2] ?? 'dist');
const metadata = JSON.parse(readFileSync(resolve(output, 'metadata.json'), 'utf8'));
for (const platform of ['ios', 'android']) {
  const bundle = metadata.fileMetadata?.[platform]?.bundle;
  assert.ok(bundle, `${platform} paketi export içinde bulunamadı.`);
  const path = resolve(output, bundle);
  const local = relative(output, path);
  assert.ok(!local.startsWith('..') && !isAbsolute(local), 'Paket export dizininde olmalı.');
  assert.ok(statSync(path).size > 0, `${platform} paketi boş.`);
  const map = JSON.parse(readFileSync(`${path}.map`, 'utf8'));
  assert.ok(/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(map.debugId ?? map.debug_id ?? ''),
    `${platform} source map Sentry debug ID içermeli.`);
  assert.ok(map.sources?.length && map.mappings?.length, `${platform} source map boş.`);
}
console.log('İki platformun paketleri ve Sentry source map bilgileri doğrulandı.');

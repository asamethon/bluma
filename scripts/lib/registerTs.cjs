/**
 * Node betiklerinin uygulama TypeScript'ini DOĞRUDAN require etmesini sağlar.
 *
 * Neden: ölçüm betiği ile uygulama AYNI mantığı kullanmak zorunda. Kuralları
 * betiğe kopyalasak iki uygulama zamanla ayrışır ve ölçüm sessizce yanlış olur —
 * düzeltmeye çalıştığımız hatanın (iki yerde duran aynı regex) tam kendisi.
 *
 * Dönüşüm projenin kendi `babel.config.js`'i ile yapılır; böylece betik, uygulama
 * kodunu uygulamanın gördüğü biçimde okur ve ek bir bağımlılık gerekmez.
 */
const Module = require('module');
const path = require('path');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..', '..');
const state = { registered: false };

/** `@/...` alias'ını proje köküne çevirir (tsconfig.json'daki paths ile aynı). */
function registerAlias() {
  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function (request, ...rest) {
    const mapped = request.startsWith('@/') ? path.join(ROOT, request.slice(2)) : request;
    return resolveFilename.call(this, mapped, ...rest);
  };
}

/** Birden çok betik require ettiğinde ikinci çağrı no-op (idempotent). */
function registerTs() {
  if (state.registered) return;
  state.registered = true;
  registerAlias();
  require.extensions['.ts'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, { cwd: ROOT, filename });
    module._compile(code, filename);
  };
}

module.exports = { registerTs };

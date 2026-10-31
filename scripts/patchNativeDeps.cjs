// Native bağımlılık yamalarını KURULUM sırasında uygular.
//
// Neden: `plugins/withIosDetachedWriteTab.js` yamayı prebuild sırasında
// node_modules içine yazıyordu. `fingerprint` runtime politikası node_modules'ü
// de hashlediği için prebuild ÖNCESİ ve SONRASI fingerprint farklı çıkıyor,
// EAS build "Runtime version mismatch" ile düşüyordu (eas-cli değeri prebuild
// öncesinde, build değeri prebuild sonrasında hesaplar).
//
// Yama postinstall'da uygulanınca node_modules her iki hesaplamada da aynı
// durumda olur; prebuild mod'u idempotent olduğu için artık yazma yapmaz.
const fs = require('node:fs');
const path = require('node:path');
const { patchController } = require('../plugins/withIosDetachedWriteTab');

const SCREENS_VERSION = '4.25.2';

function patchReactNativeScreens() {
  let metadataPath;
  try {
    metadataPath = require.resolve('react-native-screens/package.json', { paths: [path.join(__dirname, '..')] });
  } catch {
    console.log('patchNativeDeps: react-native-screens kurulu değil, atlandı.');
    return;
  }
  const { version } = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (version !== SCREENS_VERSION) {
    throw new Error(`Ayrı Yaz sekmesi yamasını react-native-screens ${version} için gözden geçir (beklenen ${SCREENS_VERSION}).`);
  }
  const file = path.join(path.dirname(metadataPath), 'ios/tabs/host/RNSTabBarController.mm');
  const original = fs.readFileSync(file, 'utf8');
  const patched = patchController(original);
  if (patched === original) return;
  fs.writeFileSync(file, patched);
  console.log('patchNativeDeps: ayrı Yaz sekmesi yaması uygulandı (react-native-screens).');
}

patchReactNativeScreens();

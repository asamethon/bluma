const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = '// === Bluma detached write tab ===';
const METHODS = fs.readFileSync(path.join(__dirname, 'ios/DetachedWriteTab.inc'), 'utf8');
const CHILDREN = '[self setViewControllers:_tabScreenControllers animated:[[self viewControllers] count] != 0];';

function patchController(source) {
  if (source.includes(MARKER)) return source;
  for (const anchor of [CHILDREN, '#pragma mark - Public API', '  [self updateTabBarA11yIfNeeded];']) {
    if (!source.includes(anchor)) throw new Error(`Ayrı Yaz sekmesi native uyumluluğu değişti: ${anchor}`);
  }
  return source
    .replace(CHILDREN, `if (![self bluma_updateModernTabs]) {\n    ${CHILDREN}\n  }`)
    // UITab API'si viewControllers dizisini doldurmaz; RNS kendi ekran dizisini kullanır.
    .replaceAll('self.viewControllers', 'self.blumaViewControllers')
    .replaceAll('[self viewControllers]', '[self blumaViewControllers]')
    .replace('  [self updateTabBarA11yIfNeeded];', '  [self updateTabBarA11yIfNeeded];\n  [self bluma_updateModernTabAppearance];')
    .replace('#pragma mark - Public API', `${MARKER}\n${METHODS}\n#pragma mark - Public API`);
}

module.exports = config => withDangerousMod(config, ['ios', cfg => {
  const metadataPath = require.resolve('react-native-screens/package.json', { paths: [cfg.modRequest.projectRoot] });
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (metadata.version !== '4.25.2') throw new Error('Ayrı Yaz sekmesi yamasını yeni react-native-screens sürümünde gözden geçir.');
  const file = path.join(path.dirname(metadataPath), 'ios/tabs/host/RNSTabBarController.mm');
  const original = fs.readFileSync(file, 'utf8');
  const patched = patchController(original);
  if (patched !== original) fs.writeFileSync(file, patched);
  return cfg;
}]);
module.exports.patchController = patchController;

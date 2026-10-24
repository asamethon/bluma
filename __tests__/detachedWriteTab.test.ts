// eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo config plugin'i Node CJS çalıştırır.
const { patchController } = require('../plugins/withIosDetachedWriteTab');
const source = `#pragma mark - Public API
[self setViewControllers:_tabScreenControllers animated:[[self viewControllers] count] != 0];
if (self.viewControllers.count == 0) return;
  [self updateTabBarA11yIfNeeded];`;

test('prebuild tekrarında native yama çoğalmaz', () => {
  const first = patchController(source);
  expect(patchController(first)).toBe(first);
});

test('UIKit modern dizisi boşken RNS seçimi kendi ekranlarıyla sürer; eski yol korunur', () => {
  const patched = patchController(source);
  expect(patched).toContain('self.blumaViewControllers.count');
  expect(patched).toContain('if (![self bluma_updateModernTabs])');
  expect(patched).toContain('return [super viewControllers]');
  expect(patched).toContain('@available(iOS 26.0, *)');
});

test('native bağımlılığın yapısı değiştiğinde sessizce eksik yama uygulanmaz', () => {
  expect(() => patchController(source.replace('  [self updateTabBarA11yIfNeeded];', ''))).toThrow();
});

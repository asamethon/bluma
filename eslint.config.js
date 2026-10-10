// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Generated dosyalar ve ayrı deploy edilen VPS görsel servisi (kendi
    // package.json + node_modules'ı var, kök RN/Expo lint kuralları geçmez).
    ignores: ['dist/*', '.expo/*', 'server/*'],
  },
  {
    // eslint-config-expo 56, react-hooks 7'nin "recommended-latest" setini
    // getiriyor; bu set React Compiler'a geçiş için tasarlanmış deneysel
    // teşhis kurallarını HATA olarak açıyor. Proje React Compiler kullanmıyor
    // (babel'de plugin yok) ve bu kurallar Reanimated `SharedValue` / legacy
    // `Animated.Value` ref'leri ve idiomatik effect desenleri üzerinde yanlış
    // pozitif üretiyor. Klasik ve her zaman değerli olan `exhaustive-deps` ve
    // `rules-of-hooks` açık kalır; yalnızca compiler'a özgü kuralları kapatıyoruz.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    files: ['scripts/**/*.{js,cjs}', 'plugins/**/*.js'],
    // Node operasyon betikleri Metro tarafından dönüştürülmez; env dinamik okunabilir.
    rules: { 'expo/no-dynamic-env-var': 'off' },
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
]);

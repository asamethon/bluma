/** Yerel Firebase, ayrı uygulama kimliği ve yalnızca sahte demo ayarları kullanır. */
module.exports = ({ config }) => {
  config = { ...config, plugins: [...config.plugins, './plugins/withLocalFirebase'] };
  // Yalnızca `release.cjs publish --pin-store-runtime` kurar: native girdiler
  // mağaza build'iyle aynıyken fingerprint'in sapması durumunda paketi o
  // build'in runtime'ına bağlar (bkz. scripts/ota/fingerprint.cjs). Değişken
  // yoksa yapılandırma değişmez, fingerprint de etkilenmez.
  const pinned = { ios: process.env.BLUMA_PIN_RUNTIME_IOS, android: process.env.BLUMA_PIN_RUNTIME_ANDROID };
  for (const platform of ['ios', 'android']) {
    if (pinned[platform]) config = { ...config, [platform]: { ...config[platform], runtimeVersion: pinned[platform] } };
  }
  if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS !== '1') return config;
  return {
    ...config,
    name: 'bluma Yerel',
    slug: 'bluma-local',
    scheme: 'bluma-local',
    updates: { ...config.updates, enabled: false },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.asamethon.bluma.local',
      googleServicesFile: './config/local-firebase/GoogleService-Info.emulator.plist',
      associatedDomains: [],
      usesAppleSignIn: false,
      infoPlist: { ...config.ios.infoPlist, FirebaseAnalyticsCollectionEnabled: false,
        FirebaseMessagingAutoInitEnabled: false },
    },
    android: {
      ...config.android,
      package: 'com.d4tecompany.bluma.local',
      googleServicesFile: './config/local-firebase/google-services.emulator.json',
      intentFilters: [],
    },
    plugins: config.plugins.filter(plugin => plugin !== 'expo-apple-authentication'),
    extra: { ...config.extra, firebaseEmulator: true },
  };
};

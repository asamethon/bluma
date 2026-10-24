const { withInfoPlist } = require('expo/config-plugins');

/** Yerel analitik ayarları, normal prebuild'e dönüldüğünde kalıntı bırakmaz. */
module.exports = config => {
  const source = { ...config.ios?.infoPlist };
  return withInfoPlist(config, result => {
    for (const key of ['FirebaseAnalyticsCollectionEnabled', 'FirebaseMessagingAutoInitEnabled']) {
      if (Object.hasOwn(source, key)) result.modResults[key] = source[key];
      else delete result.modResults[key];
    }
    return result;
  });
};

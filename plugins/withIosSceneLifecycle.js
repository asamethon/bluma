const fs = require('fs');
const path = require('path');
const { IOSConfig, withAppDelegate, withDangerousMod, withInfoPlist, withXcodeProject } = require('expo/config-plugins');

const MARKER = '// Bluma: UIScene başlangıcı';
const SCENE_FILE = 'BlumaSceneDelegate.swift';

/** SDK 56 şablonunda Firebase başlangıcını koruyarak yalnızca pencereyi sahneye taşır. */
function patchAppDelegate(contents) {
  if (contents.includes(MARKER)) return contents;
  const windowCreation = /^[ \t]*window = UIWindow\(frame: UIScreen\.main\.bounds\)\r?\n/m;
  const reactStartup = /^[ \t]*factory\.startReactNative\(\s*withModuleName: "main",\s*in: window,\s*launchOptions: launchOptions\)\r?\n/m;
  const factoryAssignment = '    reactNativeFactory = factory';
  if (!windowCreation.test(contents) || !reactStartup.test(contents) || !contents.includes(factoryAssignment)) {
    throw new Error('[withIosSceneLifecycle] Beklenen Expo SDK 56 AppDelegate şablonu bulunamadı.');
  }
  return contents
    .replace('  var window: UIWindow?', '  var window: UIWindow?\n  var sceneLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?')
    .replace(factoryAssignment, `${factoryAssignment}\n    ${MARKER}\n    sceneLaunchOptions = launchOptions`)
    .replace(windowCreation, '')
    .replace(reactStartup, '');
}

function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, cfg => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'Default Configuration',
          UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).BlumaSceneDelegate',
        }],
      },
    };
    return cfg;
  });
  config = withAppDelegate(config, cfg => {
    if (cfg.modResults.language !== 'swift') throw new Error('[withIosSceneLifecycle] Swift AppDelegate gereklidir.');
    cfg.modResults.contents = patchAppDelegate(cfg.modResults.contents);
    return cfg;
  });
  config = withDangerousMod(config, ['ios', cfg => {
    const root = IOSConfig.Paths.getSourceRoot(cfg.modRequest.projectRoot);
    fs.copyFileSync(path.join(__dirname, 'ios', SCENE_FILE), path.join(root, SCENE_FILE));
    return cfg;
  }]);
  return withXcodeProject(config, cfg => {
    const groupName = path.basename(IOSConfig.Paths.getSourceRoot(cfg.modRequest.projectRoot));
    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: `${groupName}/${SCENE_FILE}`, groupName, project: cfg.modResults,
    });
    return cfg;
  });
}

module.exports = withIosSceneLifecycle;
module.exports.patchAppDelegate = patchAppDelegate;

const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = '# === withIosPodDeploymentTarget ===';
const FIX_BLOCK = `
    ${MARKER}
    # Xcode 27 eski pod kaynak/izin hedeflerinin iOS 9–13 değerlerini reddeder.
    minimum_ios = Gem::Version.new(podfile_properties['ios.deploymentTarget'] || '16.4')
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current_ios = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_ios.nil? || Gem::Version.new(current_ios) < minimum_ios
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum_ios.to_s
        end
      end
    end
    # === end withIosPodDeploymentTarget ===
`;

function patchPodfile(contents) {
  if (contents.includes(MARKER)) return contents;
  const postInstall = /(react_native_post_install\([\s\S]*?\)\s*\n)/m;
  if (!postInstall.test(contents)) {
    throw new Error('[withIosPodDeploymentTarget] Podfile içinde react_native_post_install bulunamadı.');
  }
  return contents.replace(postInstall, `$1${FIX_BLOCK}`);
}

module.exports = config => withDangerousMod(config, ['ios', cfg => {
  const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
  const original = fs.readFileSync(podfilePath, 'utf8');
  const patched = patchPodfile(original);
  if (patched !== original) fs.writeFileSync(podfilePath, patched, 'utf8');
  return cfg;
}]);
module.exports.patchPodfile = patchPodfile;

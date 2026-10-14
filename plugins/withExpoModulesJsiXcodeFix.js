const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

// Xcode 27 can emit a false failure from the nested Swift build with -quiet.
// Keep the workaround in prebuild so EAS's fresh dependency install gets it.
// https://github.com/expo/expo/issues/50311
function patchBuildScript(scriptPath) {
    const original = fs.readFileSync(scriptPath, "utf8");
    const patched = original.replace(/^[ \t]*-quiet[ \t]+\\\r?\n/gm, "");
    if (patched !== original) fs.writeFileSync(scriptPath, patched, "utf8");
}

function withExpoModulesJsiXcodeFix(config) {
    return withDangerousMod(config, [
        "ios",
        (cfg) => {
            const packageRoot = path.dirname(
                require.resolve("expo-modules-jsi/package.json", {
                    paths: [cfg.modRequest.projectRoot],
                }),
            );
            patchBuildScript(
                path.join(packageRoot, "apple/scripts/build-xcframework.sh"),
            );
            return cfg;
        },
    ]);
}

module.exports = withExpoModulesJsiXcodeFix;
module.exports.patchBuildScript = patchBuildScript;

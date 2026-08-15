 
/**
 * Custom Expo config plugin to fix the {fmt} library `consteval` build
 * error that started appearing on Xcode 26.4+ for React Native projects.
 *
 * Xcode 26.4 ships a stricter Clang that rejects how the vendored {fmt}
 * library inside React Native validates format strings at compile time:
 *
 *   call to consteval function 'fmt::basic_format_string<...>' is not
 *   a constant expression
 *
 * The targeted workaround is to compile only the `fmt` pod against the
 * C++17 standard. consteval did not exist before C++20, so the
 * problematic code path is skipped and {fmt} falls back to runtime
 * format string validation. Every other pod (including React Native
 * internals that genuinely need C++20) is left untouched.
 *
 * Because `ios/` is gitignored in this Expo project (regenerated on
 * every `expo prebuild`/`expo run:ios`), a manual Podfile edit would
 * not survive. This plugin patches the generated Podfile after prebuild
 * so the fix is permanent and idempotent.
 *
 * Remove this plugin once the React Native release we depend on bumps
 * its bundled {fmt} version to one that builds cleanly under the new
 * Clang (tracked at facebook/react-native#55601, expo/expo#44229).
 */

const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MARKER = "# === withFmtConstevalFix: fmt C++17 downgrade ===";

const FIX_BLOCK = `
    ${MARKER}
    installer.pods_project.targets.each do |t|
      if t.name == 'fmt'
        t.build_configurations.each do |bc|
          bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
    # === end withFmtConstevalFix ===
`;

function patchPodfile(podfilePath) {
  if (!fs.existsSync(podfilePath)) {
    console.warn(
      `[withFmtConstevalFix] Podfile not found at ${podfilePath}, skipping.`,
    );
    return;
  }

  const original = fs.readFileSync(podfilePath, "utf8");

  if (original.includes(MARKER)) {
    return;
  }

  // Inject right after the react_native_post_install(...) call inside the
  // existing `post_install do |installer| ... end` block.
  const reactPostInstallRegex =
    /(react_native_post_install\([\s\S]*?\)\s*\n)/m;

  if (!reactPostInstallRegex.test(original)) {
    console.warn(
      "[withFmtConstevalFix] Could not locate react_native_post_install(...) in Podfile; fix not applied.",
    );
    return;
  }

  const patched = original.replace(reactPostInstallRegex, `$1${FIX_BLOCK}`);

  fs.writeFileSync(podfilePath, patched, "utf8");
  console.log(
    "[withFmtConstevalFix] Patched ios/Podfile to compile fmt against C++17.",
  );
}

function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile",
      );
      patchPodfile(podfilePath);
      return cfg;
    },
  ]);
}

module.exports = withFmtConstevalFix;

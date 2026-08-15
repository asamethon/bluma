 
/**
 * Custom Expo config plugin: keeps the launch window purple instead of
 * flashing black on Android.
 *
 * `Theme.App.SplashScreen` (native Android 12+ SplashScreen API) switches to
 * `postSplashScreenTheme="@style/AppTheme"` the moment the splash is
 * dismissed — but `AppTheme` extends `Theme.AppCompat.DayNight.NoActionBar`
 * without an explicit `android:windowBackground`, so on dark-mode devices it
 * falls back to AppCompat's dark default (near-black). Since our RN root
 * view (GestureHandlerRootView) only paints once fonts + auth + the stories
 * feed are ready, there's a real gap where the OS is showing `AppTheme`'s
 * default background before any RN content exists — visible as a plain
 * black screen instead of our purple splash.
 *
 * Because `android/` is regenerated on every `expo prebuild`, a manual
 * styles.xml edit would not survive. This plugin re-applies
 * `android:windowBackground` to match the splash color every time.
 */

const { withAndroidStyles } = require("expo/config-plugins");

const WINDOW_BACKGROUND = "@color/splashscreen_background";

function withAndroidSplashBackgroundFix(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const appTheme = styles.resources.style?.find(
      (s) => s.$.name === "AppTheme",
    );

    if (!appTheme) {
      console.warn(
        "[withAndroidSplashBackgroundFix] AppTheme style not found; fix not applied.",
      );
      return config;
    }

    appTheme.item = appTheme.item || [];
    const existing = appTheme.item.find(
      (i) => i.$.name === "android:windowBackground",
    );
    if (existing) {
      existing._ = WINDOW_BACKGROUND;
    } else {
      appTheme.item.push({
        $: { name: "android:windowBackground" },
        _: WINDOW_BACKGROUND,
      });
    }

    return config;
  });
}

module.exports = withAndroidSplashBackgroundFix;

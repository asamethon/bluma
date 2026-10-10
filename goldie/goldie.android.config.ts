import iosConfig from "./goldie.config";

const APP_ROOT = "/Users/sametbalci/Desktop/fantasy/bluma_LATEST";

/** Google Play telefon kareleri; iOS akislari ve ciktilari ayri tutulur. */
const config = {
  ...iosConfig,
  flowsDir: `${APP_ROOT}/.argent/flows/android`,
  android: {
    appPath: `${APP_ROOT}/android/app/build/outputs/apk/release/app-release.apk`,
    applicationId: "com.d4tecompany.bluma",
  },
  devices: ["pixel-10-pro"],
  scenes: iosConfig.scenes.filter((scene) => scene.kind === "screenshot"),
};

export default config;

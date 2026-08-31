/**
 * Custom Expo config plugin: "Yaz" sekmesinin ikonunu iOS asset catalog'una
 * (`WriteTab.imageset`) kopyalar.
 *
 * Neden: `<NativeTabs.Trigger.Icon src={require(...)} />` ikonu RCTImageLoader
 * ile ASENKRON yükler. iOS 26 cam sekme çubuğu, ikon geldiğinde sekme
 * yuvalarını yeniden ÖLÇMEZ; ilk yerleşim ikonsuz yapıldığı için etiketler
 * "Keş…" / "Küt…" diye kırpılır ve eski yerleşimin hayaleti ekranda kalır.
 * Herhangi bir sekmeye basmak yerleşimi zorladığı için sorun "kendiliğinden"
 * düzelmiş gibi görünür.
 *
 * Asset catalog yolu (`xcasset` prop'u) `[UIImage imageNamed:]` kullanır —
 * SENKRON. İkon ilk yerleşimde hazır olur, kırpılma ve hayalet kaybolur.
 * Açık/koyu varyantlar da katalogda tanımlı olduğu için tema değişiminde JS
 * tarafında ikon prop'u değiştirmemiz (ve yeniden yükleme yaşamamız) gerekmez.
 *
 * `ios/` her `expo prebuild`'de yeniden üretildiği için elle kopyalama kalıcı
 * olmaz; bu plugin her seferinde yeniden uygular.
 */

const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ASSET_NAME = "WriteTab";
const SCALES = [
  { suffix: "", scale: "1x" },
  { suffix: "@2x", scale: "2x" },
  { suffix: "@3x", scale: "3x" },
];

function imageEntry(theme, { suffix, scale }) {
  const entry = {
    filename: `write-tab-${theme}${suffix}.png`,
    idiom: "universal",
    scale,
  };
  if (theme === "dark") {
    entry.appearances = [{ appearance: "luminosity", value: "dark" }];
  }
  return entry;
}

function withWriteTabIcon(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const { platformProjectRoot, projectName, projectRoot } = config.modRequest;
      const source = path.join(projectRoot, "assets", "images");
      const target = path.join(
        platformProjectRoot,
        projectName,
        "Images.xcassets",
        `${ASSET_NAME}.imageset`
      );

      fs.mkdirSync(target, { recursive: true });

      for (const theme of ["light", "dark"]) {
        for (const { suffix } of SCALES) {
          const file = `write-tab-${theme}${suffix}.png`;
          fs.copyFileSync(path.join(source, file), path.join(target, file));
        }
      }

      const contents = {
        images: [
          ...SCALES.map((s) => imageEntry("light", s)),
          ...SCALES.map((s) => imageEntry("dark", s)),
        ],
        info: { author: "expo", version: 1 },
        // Pembe daire + beyaz çiçek kendi renklerini korumalı, tint almamalı.
        properties: { "template-rendering-intent": "original" },
      };
      fs.writeFileSync(
        path.join(target, "Contents.json"),
        JSON.stringify(contents, null, 2)
      );

      return config;
    },
  ]);
}

module.exports = withWriteTabIcon;

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const root = path.resolve(__dirname, "..");
const variants = [
  { suffix: "", scale: 1, mask: "bloom-tab.png" },
  { suffix: "@2x", scale: 2, mask: "bloom-tab@2x.png" },
  { suffix: "@3x", scale: 3, mask: "bloom-tab@3x.png" },
];
const themes = [
  { name: "light", color: [255, 92, 138] },
  { name: "dark", color: [255, 133, 168] },
];

for (const theme of themes) {
  for (const variant of variants) {
    const maskPath = path.join(root, "assets/images", variant.mask);
    const mask = PNG.sync.read(fs.readFileSync(maskPath));
    const size = 60 * variant.scale;
    const result = new PNG({ width: size, height: size });
    const radius = size / 2;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const target = (y * size + x) * 4;
        const dx = x + 0.5 - radius;
        const dy = y + 0.5 - radius;
        if (dx * dx + dy * dy <= radius * radius) {
          result.data[target] = theme.color[0];
          result.data[target + 1] = theme.color[1];
          result.data[target + 2] = theme.color[2];
          result.data[target + 3] = 255;
        }
      }
    }

    const offset = (size - mask.width) / 2;
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < mask.width; x += 1) {
        const source = (y * mask.width + x) * 4;
        if (mask.data[source + 3] < 24) continue;
        const target = ((y + offset) * size + x + offset) * 4;
        result.data[target] = 255;
        result.data[target + 1] = 255;
        result.data[target + 2] = 255;
        result.data[target + 3] = mask.data[source + 3];
      }
    }

    const output = path.join(
      root,
      "assets/images",
      `write-tab-${theme.name}${variant.suffix}.png`
    );
    fs.writeFileSync(output, PNG.sync.write(result));
  }
}

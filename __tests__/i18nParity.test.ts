// eslint-disable-next-line @typescript-eslint/no-require-imports -- düz dosya okuma; jest depo kökünde çalışır
const fs = require('fs');

type Tree = { [key: string]: string | Tree };
const PLURAL = /_(zero|one|two|few|many|other)$/;
const locales: Record<string, Tree> = Object.fromEntries(fs.readdirSync('i18n/locales')
  .filter((file: string) => file.endsWith('.json'))
  .map((file: string) => [file.replace('.json', ''), JSON.parse(fs.readFileSync(`i18n/locales/${file}`, 'utf8'))]));

/** Düz anahtar → metin; çoğul ekleri (_one/_other) tek anahtarda birleşir. */
function flatten(tree: Tree, prefix = '', out = new Map<string, string[]>()) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value !== 'string') flatten(value, path, out);
    else out.set(path.replace(PLURAL, ''), [...(out.get(path.replace(PLURAL, '')) ?? []), value]);
  }
  return out;
}
const placeholders = (texts: string[]) =>
  [...new Set(texts.flatMap(text => text.match(/{{\s*\w+\s*}}/g) ?? []).map(item => item.replace(/\s/g, '')))].sort();

const base = flatten(locales.tr);

describe.each(Object.keys(locales).filter(code => code !== 'tr'))('%s çevirisi', code => {
  const other = flatten(locales[code]);

  it('Türkçe ile aynı anahtarlara sahiptir (eksik anahtar İngilizceye düşer)', () => {
    expect([...base.keys()].filter(key => !other.has(key))).toEqual([]);
    expect([...other.keys()].filter(key => !base.has(key))).toEqual([]);
  });

  it('yer tutucuları Türkçe ile aynıdır', () => {
    const mismatched = [...base.entries()]
      .filter(([key, texts]) => other.has(key)
        && placeholders(texts).join() !== placeholders(other.get(key)!).join())
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });
});

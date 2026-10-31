/**
 * Hikâye künyesinin yazar kontrolleri: dil, etiketler ve içerik uyarıları.
 * Firestore'a ETİKET METNİ değil KOD yazılır; eski düzenleme ekranının
 * yazdığı Türkçe etiketler ("Türkçe", "Şiddet") okunurken koda indirilir.
 */

/** Hikâye dilleri — her biri kendi adıyla gösterilir, çeviri gerektirmez. */
export const STORY_LANGUAGES = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ar', name: 'العربية' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
] as const;

/** Eski düzenleme ekranının yazdığı dil etiketleri (aksanlar ayıklanmış). */
const LEGACY_LANGUAGE_LABELS: Record<string, string> = {
  turkce: 'tr', ingilizce: 'en', almanca: 'de', fransızca: 'fr', ispanyolca: 'es',
  italyanca: 'it', rusca: 'ru', japonca: 'ja', korece: 'ko', cince: 'zh',
};

const FOLD: Record<string, string> = { ç: 'c', ş: 's', ğ: 'g', ü: 'u', ö: 'o', â: 'a', î: 'i', û: 'u' };
/**
 * Eski etiketleri eşlemek için aksan katlama. `String.normalize` yerine açık
 * tablo: Hermes'in Unicode desteğine bağımlı kalmaz. `toLowerCase` "İ"yi
 * "i + U+0307" yapar; o birleşik işaret de atılır.
 */
const fold = (value: string) => value.trim().toLowerCase()
  .replace(/̇/g, '')
  .replace(/[çşğüöâîû]/g, letter => FOLD[letter]);

/** "Türkçe", "tr", "TR", "pt-BR" → temel dil kodu; tanınmayan değer → undefined. */
export function normalizeLanguage(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const label = LEGACY_LANGUAGE_LABELS[fold(value)];
  if (label) return label;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return /^[a-z]{2,3}$/.test(base) ? base : undefined;
}

/**
 * Eski hikâyelerde `language: 'Türkçe'` duruyordu; doğrudan karşılaştırma
 * 'tr' ile eşleşmiyor ve Türk okura yanlış dil cezası veriyordu.
 */
export function sameLanguage(a?: string | null, b?: string | null): boolean {
  const left = normalizeLanguage(a);
  return !!left && left === normalizeLanguage(b);
}

export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 20;

/** Kullanıcının yazdığı etiket: baştaki #, fazla boşluk ve büyük harf ayıklanır. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim().toLowerCase()
    .slice(0, MAX_TAG_LENGTH).trim();
}

/** Etiket listesine ekler; boş, yinelenen ya da sınırı aşan eklemeyi yok sayar. */
export function addTag(tags: string[], raw: string): string[] {
  const tag = normalizeTag(raw);
  if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return tags;
  return [...tags, tag];
}

/** İçerik uyarısı kodları; metinleri `contentWarnings.<kod>` çeviri anahtarındadır. */
export const CONTENT_WARNINGS = [
  'violence', 'sexual', 'profanity', 'substances', 'selfHarm',
  'eatingDisorder', 'racism', 'homophobia', 'transphobia', 'animalHarm',
] as const;
export type ContentWarning = typeof CONTENT_WARNINGS[number];

const LEGACY_WARNING_LABELS: Record<string, ContentWarning> = {
  'siddet': 'violence', 'cinsel icerik': 'sexual', 'kufur': 'profanity',
  'madde kullanımı': 'substances', 'kendine zarar verme': 'selfHarm',
  'yeme bozuklukları': 'eatingDisorder', 'ırkcılık': 'racism', 'irkcılık': 'racism',
  'homofobi': 'homophobia', 'transfobi': 'transphobia', 'hayvan zararı': 'animalHarm',
};
const isWarning = (value: string): value is ContentWarning =>
  (CONTENT_WARNINGS as readonly string[]).includes(value);

/** Kodlar ve eski Türkçe etiketler → tekil, sıralı kod listesi. */
export function normalizeWarnings(values?: string[] | null): ContentWarning[] {
  const codes = new Set<ContentWarning>();
  for (const value of values ?? []) {
    if (isWarning(value)) codes.add(value);
    else {
      const legacy = LEGACY_WARNING_LABELS[fold(value)];
      if (legacy) codes.add(legacy);
    }
  }
  return CONTENT_WARNINGS.filter(code => codes.has(code));
}

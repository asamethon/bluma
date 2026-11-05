import {
  BANNER_SNOOZE_MS,
  EMPTY_PROMPT_RECORD,
  PROMPT_COOLDOWN_MS,
  PROMPT_MAX_SHOWS,
  SILENT_PROMPT_RECORD,
  canOfferPrompt,
  canShowBanner,
  toPushPermission,
} from '@/features/notifications/utils/pushPermissionRules';

const NOW = 1_800_000_000_000;

describe('toPushPermission', () => {
  it('verilmiş izin', () => {
    expect(toPushPermission({ status: 'granted', canAskAgain: true })).toBe('granted');
  });
  it('iOS geçici izni de bildirim teslim eder', () => {
    expect(toPushPermission({ status: 'undetermined', canAskAgain: true, ios: { status: 3 } })).toBe('granted');
  });
  it('hiç sorulmamış: sistem penceresi açılabilir', () => {
    expect(toPushPermission({ status: 'undetermined', canAskAgain: true })).toBe('askable');
  });
  it('iOS\'ta bir kez reddedilmiş: yalnızca Ayarlar\'dan', () => {
    expect(toPushPermission({ status: 'denied', canAskAgain: false })).toBe('blocked');
  });
  it('Android 13\'te bir kez reddedilmiş: bir kez daha sorulabilir', () => {
    expect(toPushPermission({ status: 'denied', canAskAgain: true })).toBe('askable');
  });
});

describe('canOfferPrompt', () => {
  it('izin kapalıysa ilk değer anında kart açılır', () => {
    expect(canOfferPrompt(EMPTY_PROMPT_RECORD, 'askable', NOW)).toBe(true);
    expect(canOfferPrompt(EMPTY_PROMPT_RECORD, 'blocked', NOW)).toBe(true);
  });
  it('izin varsa ya da durum bilinmiyorsa açılmaz', () => {
    expect(canOfferPrompt(EMPTY_PROMPT_RECORD, 'granted', NOW)).toBe(false);
    expect(canOfferPrompt(EMPTY_PROMPT_RECORD, 'unsupported', NOW)).toBe(false);
    expect(canOfferPrompt(EMPTY_PROMPT_RECORD, null, NOW)).toBe(false);
  });
  it('bekleme süresi dolmadan tekrar açılmaz', () => {
    const record = { ...EMPTY_PROMPT_RECORD, shows: 1, lastShownAt: NOW - PROMPT_COOLDOWN_MS + 1 };
    expect(canOfferPrompt(record, 'askable', NOW)).toBe(false);
    expect(canOfferPrompt({ ...record, lastShownAt: NOW - PROMPT_COOLDOWN_MS }, 'askable', NOW)).toBe(true);
  });
  it('sınır dolunca bir daha açılmaz', () => {
    expect(canOfferPrompt({ ...EMPTY_PROMPT_RECORD, shows: PROMPT_MAX_SHOWS }, 'askable', NOW)).toBe(false);
  });
  it('kayıt okunamazsa susar', () => {
    expect(canOfferPrompt(SILENT_PROMPT_RECORD, 'askable', NOW)).toBe(false);
  });
});

describe('canShowBanner', () => {
  it('izin kapalıyken görünür', () => {
    expect(canShowBanner(EMPTY_PROMPT_RECORD, 'blocked', NOW)).toBe(true);
  });
  it('"Şimdi değil" sonrası bir hafta gizli kalır', () => {
    const record = { ...EMPTY_PROMPT_RECORD, bannerUntil: NOW + BANNER_SNOOZE_MS };
    expect(canShowBanner(record, 'askable', NOW)).toBe(false);
    expect(canShowBanner(record, 'askable', NOW + BANNER_SNOOZE_MS)).toBe(true);
  });
  it('izin açıksa görünmez', () => {
    expect(canShowBanner(EMPTY_PROMPT_RECORD, 'granted', NOW)).toBe(false);
  });
});

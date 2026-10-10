import { createUpdateChecker } from '@/features/updates/services/updateChecker';

function setup() {
  const clock = { now: 0 };
  const deps = {
    enabled: jest.fn(() => true),
    online: jest.fn(async () => true),
    check: jest.fn(async () => ({ isAvailable: false, isRollBackToEmbedded: false })),
    fetch: jest.fn(async () => ({ isNew: true, isRollBackToEmbedded: false })),
    now: () => clock.now,
    report: jest.fn(),
  };
  return { clock, deps, checker: createUpdateChecker(deps) };
}

describe('OTA indirme yaşam döngüsü', () => {
  it('geliştirme istemcisinde hiçbir ağ isteği başlatmaz', async () => {
    const { deps, checker } = setup();
    deps.enabled.mockReturnValue(false);
    expect(await checker.check()).toBe('skipped');
    expect(deps.online).not.toHaveBeenCalled();
  });

  it('eşzamanlı foreground ve bağlantı olayları tek isteği paylaşır', async () => {
    const { deps, checker } = setup();
    const first = checker.check();
    expect(checker.check()).toBe(first);
    await first;
    expect(deps.check).toHaveBeenCalledTimes(1);
  });

  it('çevrimdışı deneme, bağlantı geri geldiğinde kontrolü engellemez', async () => {
    const { deps, checker } = setup();
    deps.online.mockResolvedValueOnce(false);
    expect(await checker.check()).toBe('skipped');
    expect(await checker.check()).toBe('current');
    expect(deps.check).toHaveBeenCalledTimes(1);
  });

  it('başarılı kontrolden sonra 30 dakika bekler', async () => {
    const { clock, deps, checker } = setup();
    await checker.check();
    clock.now = 30 * 60 * 1000 - 1;
    expect(await checker.check()).toBe('skipped');
    clock.now += 1;
    expect(await checker.check()).toBe('current');
    expect(deps.check).toHaveBeenCalledTimes(2);
  });

  it('başarısız indirmeyi 5 dakika sonra yeniden dener', async () => {
    const { clock, deps, checker } = setup();
    deps.check.mockResolvedValue({ isAvailable: true, isRollBackToEmbedded: false });
    deps.fetch.mockRejectedValueOnce(new Error('bağlantı kesildi'));
    expect(await checker.check()).toBe('error');
    expect(await checker.check()).toBe('skipped');
    clock.now = 5 * 60 * 1000;
    expect(await checker.check()).toBe('pending');
    expect(deps.fetch).toHaveBeenCalledTimes(2);
  });

  it('rollback isAvailable=false olsa da yönergeyi diske indirir', async () => {
    const { deps, checker } = setup();
    deps.check.mockResolvedValue({ isAvailable: false, isRollBackToEmbedded: true });
    deps.fetch.mockResolvedValue({ isNew: false, isRollBackToEmbedded: true });
    expect(await checker.check()).toBe('pending');
    expect(deps.fetch).toHaveBeenCalledTimes(1);
    expect(await checker.check()).toBe('skipped');
  });

  it('indirmeden hemen sonra tekrar kontrol etmez', async () => {
    const { clock, deps, checker } = setup();
    deps.check.mockResolvedValue({ isAvailable: true, isRollBackToEmbedded: false });
    expect(await checker.check()).toBe('pending');
    clock.now = 30 * 60 * 1000 - 1;
    expect(await checker.check()).toBe('skipped');
    expect(deps.fetch).toHaveBeenCalledTimes(1);
  });

  it('paket indirildikten sonra geri çekilirse sonraki foreground kontrolünde rollback alır', async () => {
    const { clock, deps, checker } = setup();
    deps.check.mockResolvedValueOnce({ isAvailable: true, isRollBackToEmbedded: false });
    expect(await checker.check()).toBe('pending');
    clock.now = 30 * 60 * 1000;
    deps.check.mockResolvedValue({ isAvailable: false, isRollBackToEmbedded: true });
    deps.fetch.mockResolvedValue({ isNew: false, isRollBackToEmbedded: true });
    expect(await checker.check()).toBe('pending');
    expect(deps.fetch).toHaveBeenCalledTimes(2);
  });

  it('kontrol/indirme arasında sunucuda paket değişirse pending varsaymaz', async () => {
    const { deps, checker } = setup();
    deps.check.mockResolvedValue({ isAvailable: true, isRollBackToEmbedded: false });
    deps.fetch.mockResolvedValue({ isNew: false, isRollBackToEmbedded: false });
    expect(await checker.check()).toBe('current');
  });
});

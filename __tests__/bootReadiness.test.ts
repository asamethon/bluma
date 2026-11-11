import { canRevealApp } from '@/features/bootstrap/utils/bootReadiness';

const pending = {
  fontsLoaded: true,
  authLoading: true,
  storiesLoaded: false,
  continueReadingReady: false,
  banChecked: true,
  timedOut: false,
};
const dataReady = { ...pending, authLoading: false, storiesLoaded: true, continueReadingReady: true };

describe('açılış perdesi', () => {
  it('ağ ve oturum yüklemesi sürse de süre dolunca açılır', () => {
    expect(canRevealApp({ ...pending, timedOut: true })).toBe(true);
  });

  it('veriler erken hazırsa süreyi beklemez', () => {
    expect(canRevealApp(dataReady)).toBe(true);
  });

  it('cihaz banı cevabı gelmeden perde kalkmaz', () => {
    // Banlı kullanıcı uygulamayı bir an görüp ban ekranına düşmemeli.
    expect(canRevealApp({ ...dataReady, banChecked: false })).toBe(false);
  });

  it('ban kontrolü takılsa da süre sınırı perdeyi kaldırır', () => {
    expect(canRevealApp({ ...pending, banChecked: false, timedOut: true })).toBe(true);
  });

  it('fontlar hazır değilse ekranı çizmez', () => {
    expect(canRevealApp({ ...pending, fontsLoaded: false, timedOut: true })).toBe(false);
  });
});

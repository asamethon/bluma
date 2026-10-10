import { canRevealApp } from '@/features/bootstrap/utils/bootReadiness';

const pending = {
  fontsLoaded: true,
  authLoading: true,
  storiesLoaded: false,
  continueReadingReady: false,
  timedOut: false,
};

describe('açılış perdesi', () => {
  it('ağ ve oturum yüklemesi sürse de süre dolunca açılır', () => {
    expect(canRevealApp({ ...pending, timedOut: true })).toBe(true);
  });

  it('veriler erken hazırsa süreyi beklemez', () => {
    expect(canRevealApp({ ...pending, authLoading: false, storiesLoaded: true, continueReadingReady: true }))
      .toBe(true);
  });

  it('fontlar hazır değilse ekranı çizmez', () => {
    expect(canRevealApp({ ...pending, fontsLoaded: false, timedOut: true })).toBe(false);
  });
});

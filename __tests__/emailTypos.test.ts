import { suggestEmailFix } from '@/features/auth/utils/emailTypos';

describe('suggestEmailFix', () => {
  it('yaygın yazım hatasını düzeltir', () => {
    expect(suggestEmailFix('kullanici@gmial.com')).toBe('kullanici@gmail.com');
  });

  it('doğru adrese dokunmaz', () => {
    expect(suggestEmailFix('kullanici@gmail.com')).toBeNull();
  });

  it('bilinmeyen alan adına öneri üretmez', () => {
    expect(suggestEmailFix('kullanici@sirketim.com.tr')).toBeNull();
  });

  it('@ içermeyen metinde çökmez', () => {
    expect(suggestEmailFix('gecersiz')).toBeNull();
  });
});

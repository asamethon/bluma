import { profileWebsite } from '@/features/profile/utils/profileWebsite';

describe('profil web sitesi', () => {
  it('şemasız adrese https ekler, etiketi sadeleştirir', () => {
    expect(profileWebsite('siten.com')).toEqual({ url: 'https://siten.com', label: 'siten.com' });
    expect(profileWebsite(' https://www.ornek.com/blog/ ')).toEqual({ url: 'https://www.ornek.com/blog/', label: 'ornek.com/blog' });
    expect(profileWebsite('ornek.com:8080')).toEqual({ url: 'https://ornek.com:8080', label: 'ornek.com:8080' });
  });
  it('tehlikeli ya da geçersiz adresleri açmaz', () => {
    for (const value of ['javascript:alert(1)', 'mailto:a@b.com', 'bluma://story/1', 'localhost', 'iki kelime.com', '', undefined]) {
      expect(profileWebsite(value)).toBeNull();
    }
  });
});

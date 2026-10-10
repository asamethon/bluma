import { formatFileSize } from '@/features/profile/components/offline/fileSize';

describe('formatFileSize', () => {
  it('1024 KB altını KB olarak yazar', () => {
    expect(formatFileSize(512)).toBe('512.0 KB');
  });

  it('1024 KB ve üstünü MB olarak yazar', () => {
    expect(formatFileSize(2048)).toBe('2.0 MB');
  });

  it('sıfırı da güvenle biçimlendirir', () => {
    expect(formatFileSize(0)).toBe('0.0 KB');
  });
});

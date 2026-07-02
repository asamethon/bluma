import { StoryCategory } from '@/types';

// Hikaye düzenleme ekranının sabit seçenek listeleri.
export const categories: { value: StoryCategory; label: string }[] = [
  { value: 'romance', label: 'Romantik' },
  { value: 'fantasy', label: 'Fantastik' },
  { value: 'mystery', label: 'Gizem' },
  { value: 'drama', label: 'Drama' },
  { value: 'adventure', label: 'Macera' },
  { value: 'horror', label: 'Korku' },
  { value: 'comedy', label: 'Komedi' },
  { value: 'poetry', label: 'Şiir' },
  { value: 'other', label: 'Diğer' },
];

export const targetAudiences = [
  { value: 'all', label: 'Herkes' },
  { value: 'teen', label: 'Gençler (13-17)' },
  { value: 'adult', label: 'Yetişkinler (18+)' },
];

export const languages = [
  'Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca',
  'İtalyanca', 'Rusça', 'Japonca', 'Korece', 'Çince',
];

export const commonContentWarnings = [
  'Şiddet', 'Cinsel İçerik', 'Küfür', 'Madde Kullanımı',
  'Kendine Zarar Verme', 'Yeme Bozuklukları', 'Irkçılık',
  'Homofobi', 'Transfobi', 'Hayvan Zararı',
];

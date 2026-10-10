import i18n from '@/i18n';

export const formatXp = (value: number) => (
  value >= 1000 ? `${(value / 1000).toFixed(1)}${i18n.t('common.thousandSuffix')}` : String(value)
);

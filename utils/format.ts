import i18n from '@/i18n';

export function formatCount(n?: number) {
  if (!n) return '0';
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}${i18n.t('common.thousandSuffix')}`;
  }
  return `${n}`;
}

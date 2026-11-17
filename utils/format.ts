import i18n from '@/i18n';

/**
 * Sayaç gösterimi. Geçmiş yarışlardan kalan eksi değerler ("-1 beğeni")
 * kullanıcıya gösterilmez; kaynak sunucu anlık görüntüsü bile olsa 0'a kırpılır.
 */
export const safeCount = (value?: number | null) => Math.max(0, value ?? 0);

export function formatCount(n?: number) {
  if (!n) return '0';
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}${i18n.t('common.thousandSuffix')}`;
  }
  return `${n}`;
}

/* eslint-disable @typescript-eslint/no-require-imports */
import { isFounder } from '@/features/milestone/constants';
import { formatJoinDate, formatNumber } from '@/features/milestone/utils/milestoneFormat';
import { isMilestoneLive, parseMilestone } from '@/features/milestone/utils/parseMilestone';

const { assignMemberNumbers } = require('../scripts/milestone/memberNumbers.cjs');

describe('isFounder', () => {
  it.each([[1, true], [1000, true], [1001, false], [0, false], [undefined, false], [12.5, false]])(
    '%p → %p', (n, expected) => expect(isFounder(n as number | undefined)).toBe(expected));
});

describe('parseMilestone', () => {
  it('bozuk alanları 0 yapar', () => {
    const m = parseMilestone('1k', { active: true, members: '1000', stats: { stories: 42, reads: -3 } });
    expect(m).toEqual({ id: '1k', active: true, members: 0, stats: { stories: 42, writers: 0, reads: 0, comments: 0 }, endsAt: 0 });
  });
  it('belge yoksa null', () => expect(parseMilestone('1k', undefined)).toBeNull());
});

describe('isMilestoneLive', () => {
  const base = parseMilestone('1k', { active: true })!;
  it('süresiz açık', () => expect(isMilestoneLive(base, Date.now())).toBe(true));
  it('süresi dolmuş', () => expect(isMilestoneLive({ ...base, endsAt: 100 }, 200)).toBe(false));
  it('kapalı', () => expect(isMilestoneLive({ ...base, active: false }, 0)).toBe(false));
  it('null', () => expect(isMilestoneLive(null, 0)).toBe(false));
});

describe('assignMemberNumbers', () => {
  it('kayıt sırasına göre numaralar, eşitlikte ID', () => {
    const map = assignMemberNumbers([
      { id: 'c', createdAt: 30 }, { id: 'b', createdAt: 10 }, { id: 'a', createdAt: 10 }, { id: 'z', createdAt: 0 },
    ]);
    expect([...map.entries()]).toEqual([['a', 1], ['b', 2], ['c', 3], ['z', 4]]);
  });
  it('var olan numaralar korunur, yeniler devam eder', () => {
    const map = assignMemberNumbers([
      { id: 'a', createdAt: 10, memberNumber: 1 }, { id: 'b', createdAt: 20, memberNumber: 2 }, { id: 'c', createdAt: 5 },
    ]);
    expect([...map.entries()]).toEqual([['c', 3]]);
  });
});

describe('format', () => {
  it('dilin gruplaması', () => {
    expect(formatNumber(1000, 'tr')).toBe('1.000');
    expect(formatNumber(1000, 'en')).toBe('1,000');
  });
  it('tarih yoksa boş', () => expect(formatJoinDate(0, 'tr')).toBe(''));
});

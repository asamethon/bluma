import { USERNAME_HISTORY_LIMIT, nextPreviousUsernames } from '@/features/auth/utils/usernameHistory';

describe('nextPreviousUsernames', () => {
  it('eski adı listenin başına alır', () => {
    expect(nextPreviousUsernames([], 'gkeylmaz')).toEqual(['gkeylmaz']);
    expect(nextPreviousUsernames(['eski'], 'gkeylmaz')).toEqual(['gkeylmaz', 'eski']);
  });

  it('geçmiş yoksa (undefined) çalışır', () => {
    expect(nextPreviousUsernames(undefined, 'gkeylmaz')).toEqual(['gkeylmaz']);
  });

  it('tekrarları eler — aynı ada geri dönüp tekrar ayrılmak listeyi şişirmez', () => {
    expect(nextPreviousUsernames(['a', 'gkeylmaz', 'b'], 'gkeylmaz')).toEqual(['gkeylmaz', 'a', 'b']);
  });

  it('son 5 adı tutar', () => {
    const history = ['a', 'b', 'c', 'd', 'e'];
    const result = nextPreviousUsernames(history, 'yeni');
    expect(result).toHaveLength(USERNAME_HISTORY_LIMIT);
    expect(result).toEqual(['yeni', 'a', 'b', 'c', 'd']);
  });

  it('yeni adı geçmişten çıkarır — kendi eski adına dönen kullanıcı', () => {
    // "gokceyilmaz" iken "gkeylmaz"a dönen kullanıcı: güncel adı geçmişinde
    // kalmamalı, yoksa kendi adı "başkasının eski adı" gibi görünür.
    expect(nextPreviousUsernames(['gkeylmaz'], 'gokceyilmaz', 'gkeylmaz')).toEqual(['gokceyilmaz']);
  });

  it('yeni ad listenin ortasındayken de çıkarılır', () => {
    expect(nextPreviousUsernames(['a', 'hedef', 'b'], 'eski', 'hedef')).toEqual(['eski', 'a', 'b']);
  });

  it('yeni ad verilmezse davranış değişmez', () => {
    expect(nextPreviousUsernames(['a', 'b'], 'eski')).toEqual(['eski', 'a', 'b']);
  });

  it('boş eski adda listeyi olduğu gibi bırakır', () => {
    expect(nextPreviousUsernames(['a'], '')).toEqual(['a']);
    expect(nextPreviousUsernames(undefined, '')).toEqual([]);
  });

  it('girdiyi değiştirmez', () => {
    const history = ['a', 'b'];
    nextPreviousUsernames(history, 'yeni');
    expect(history).toEqual(['a', 'b']);
  });
});

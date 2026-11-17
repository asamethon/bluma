import { chainLikeWrite, queueLikeWrite } from '@/lib/likeQueue';
import { likePlan } from '@/lib/likeToggle';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(),
  increment: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('@/utils/logger', () => ({ logger: { error: jest.fn() } }));

/** Çözümü elimizde tutan söz: zincirin ortasına dokunuş sokabilmek için. */
function deferred() {
  let resolve: () => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('beğeni kuyruğu', () => {
  it('beğen-bırak-beğen tek yazmaya iner', async () => {
    const gate = deferred();
    const writes: boolean[] = [];
    const write = (desired: boolean) => { writes.push(desired); return gate.promise; };

    const first = queueLikeWrite('story:1', { desired: true, previous: false }, write);
    // Yazma sürerken gelen dokunuşlar yalnızca hedefi değiştirir.
    queueLikeWrite('story:1', { desired: false, previous: true }, write);
    queueLikeWrite('story:1', { desired: true, previous: false }, write);
    gate.resolve();
    const outcome = await first;

    expect(writes).toEqual([true]);
    expect(outcome).toEqual({ ok: true, desired: true, previous: false });
  });

  it('yazma bitince istenen durum değiştiyse bir tur daha atar', async () => {
    const first = deferred();
    const writes: boolean[] = [];
    const write = (desired: boolean) => {
      writes.push(desired);
      return writes.length === 1 ? first.promise : Promise.resolve();
    };

    const chain = queueLikeWrite('story:2', { desired: true, previous: false }, write);
    queueLikeWrite('story:2', { desired: false, previous: true }, write);
    first.resolve();
    const outcome = await chain;

    expect(writes).toEqual([true, false]);
    expect(outcome.desired).toBe(false);
  });

  it('hata, zincir başlamadan önceki durumu geri bildirir', async () => {
    const outcome = await queueLikeWrite(
      'story:3',
      { desired: true, previous: false },
      () => Promise.reject(new Error('izin yok')),
    );
    expect(outcome).toEqual({ ok: false, desired: true, previous: false });
  });

  it('zincir bitince anahtar serbest kalır', async () => {
    const writes: boolean[] = [];
    const write = (desired: boolean) => { writes.push(desired); return Promise.resolve(); };
    await queueLikeWrite('story:4', { desired: true, previous: false }, write);
    await queueLikeWrite('story:4', { desired: false, previous: true }, write);
    expect(writes).toEqual([true, false]);
  });

  it('farklı anahtarlar birbirini beklemez', async () => {
    const writes: string[] = [];
    await Promise.all([
      queueLikeWrite('a', { desired: true, previous: false }, async () => { writes.push('a'); }),
      queueLikeWrite('b', { desired: true, previous: false }, async () => { writes.push('b'); }),
    ]);
    expect(writes.sort()).toEqual(['a', 'b']);
  });
});

describe('çevirme kipi (hikâye yorumu)', () => {
  it('dokunuşları birleştirmez ama sıraya dizer', async () => {
    const order: string[] = [];
    const slow = deferred();
    const first = chainLikeWrite('comment:1', async () => { order.push('başladı-1'); await slow.promise; order.push('bitti-1'); });
    const second = chainLikeWrite('comment:1', async () => { order.push('başladı-2'); });
    slow.resolve();
    await Promise.all([first, second]);
    expect(order).toEqual(['başladı-1', 'bitti-1', 'başladı-2']);
  });

  it('hata sonraki yazmayı durdurmaz', async () => {
    const failing = chainLikeWrite('comment:2', () => Promise.reject(new Error('ağ')));
    await expect(failing).rejects.toThrow('ağ');
    await expect(chainLikeWrite('comment:2', async () => 'tamam')).resolves.toBe('tamam');
  });
});

describe('transaction planı', () => {
  it('aynı durum yazma üretmez', () => {
    expect(likePlan(true, true)).toBe('none');
    expect(likePlan(false, false)).toBe('none');
  });

  it('eksik kaydı yazar, fazla kaydı siler', () => {
    expect(likePlan(false, true)).toBe('create');
    expect(likePlan(true, false)).toBe('remove');
  });
});

import { configureStore } from '@reduxjs/toolkit';
import auth from '@/store/slices/authSlice';
import challenge from '@/store/slices/challengeSlice';
import { emptyChallengeData, type ChallengeData } from '@/features/challenges/services/challengeState';
import { todayKey, weekStartKey } from '@/features/challenges/services/challengeCalendar';

export const testStore = configureStore({ reducer: { auth, challenge } });
export const database = new Map<string, ChallengeData>();
export const identity = { currentUser: null as { uid: string } | null };
export const appState = { callback: (_state: string) => {} };
export const scenario = {
  beforeRead: null as (() => Promise<void>) | null,
  beforeCommit: null as (() => Promise<void>) | null,
  retry: null as (() => void) | null,
};
export function seed(userId: string, data: Partial<ChallengeData> = {}) {
  database.set(userId, { ...emptyChallengeData, streak: 2, lastActiveDate: todayKey(),
    challengeWeekStart: weekStartKey(), ...data });
}
export function deferred() {
  const control = { resolve: () => {} };
  const promise = new Promise<void>(resolve => { control.resolve = resolve; });
  return { promise, resolve: () => control.resolve() };
}
function transaction() {
  const writes: (() => void)[] = [];
  return {
    get: async (userId: string) => {
      const data = database.get(userId);
      const copy = data && JSON.parse(JSON.stringify(data));
      const callback = scenario.beforeRead;
      scenario.beforeRead = null;
      await callback?.();
      return { exists: () => !!copy, data: () => copy };
    },
    update: (userId: string, updates: Record<string, any>) => {
      writes.push(() => {
        const data = JSON.parse(JSON.stringify(database.get(userId)));
        for (const [path, value] of Object.entries(updates)) {
          const [field, key] = path.split('.');
          // Gerçek Firestore gibi: `alan.anahtar` yolu eksik haritayı oluşturur.
          if (key) data[field] ??= {};
          const target = key ? data[field] : data;
          const property = key ?? field;
          target[property] = value && typeof value === 'object' && 'delta' in value
            ? (target[property] ?? 0) + value.delta
            : value && typeof value === 'object' && 'union' in value
              ? [...new Set([...(target[property] ?? []), ...value.union])] : value;
        }
        database.set(userId, data);
      });
    },
    commit: () => writes.forEach(write => write()),
  };
}
export const firestoreMock = {
  getFirestore: () => ({}),
  doc: (_db: unknown, _collection: string, userId: string) => userId,
  getDocFromServer: jest.fn((userId: string) => transaction().get(userId)),
  increment: (delta: number) => ({ delta }),
  arrayUnion: (...union: string[]) => ({ union }),
  runTransaction: jest.fn(async (_db: unknown, operation: (tx: ReturnType<typeof transaction>) => Promise<unknown>) => {
    if (scenario.retry) {
      await operation(transaction());
      scenario.retry();
      scenario.retry = null;
    }
    const tx = transaction();
    const result = await operation(tx);
    const callback = scenario.beforeCommit;
    scenario.beforeCommit = null;
    await callback?.();
    tx.commit();
    return result;
  }),
};

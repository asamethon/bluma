import type { UserLookup } from '@/features/auth/services/userCache';
import { excessSteps } from '@/features/profile/services/connectionCounters';
import { partitionLookups, type ConnectionList } from '@/features/profile/services/connections';
import type { User } from '@/types';

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
  increment: jest.fn(),
  updateDoc: jest.fn(),
}));
jest.mock('@/store', () => ({
  store: { getState: () => ({ auth: { user: null } }), dispatch: jest.fn() },
}));
jest.mock('@/utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));

const found = (id: string): UserLookup => ({ state: 'found', user: { id } as User });
const list = (over: Partial<ConnectionList> = {}): ConnectionList =>
  ({ users: [], ghosts: [], unreadable: [], ...over });

describe('partitionLookups', () => {
  // "Yok" ile "okunamadı" aynı şey değil: biri silinmiş hesap, diğeri ağ hatası.
  it('bulunanı, hayaleti ve okunamayanı ayırır', () => {
    const result = partitionLookups(
      ['canli', 'silinmis', 'okunamadi'],
      [found('canli'), { state: 'missing' }, { state: 'unreadable' }],
    );
    expect(result.users.map(user => user.id)).toEqual(['canli']);
    expect(result.ghosts).toEqual(['silinmis']);
    expect(result.unreadable).toEqual(['okunamadi']);
  });

  it('eksik sonucu okunamayan sayar, kullanıcıyı sessizce düşürmez', () => {
    const result = partitionLookups(['a', 'b'], [found('a')]);
    expect(result.users).toHaveLength(1);
    expect(result.unreadable).toEqual(['b']);
  });
});

describe('excessSteps', () => {
  // Kullanıcının bildirdiği durum: profilde 6, listede 5 kişi.
  it('fazla sayan sayacı listedeki kişi sayısına indirir', () => {
    expect(excessSteps(6, list({ users: [{ id: 'a' }, { id: 'b' }, { id: 'c' },
      { id: 'd' }, { id: 'e' }] as User[], ghosts: ['hayalet'] }))).toBe(1);
  });

  // Elimizde tam tablo yoksa sayaca dokunmak gerçek takipçiyi silmek olur.
  it('okunamayan kişi varsa sayaca dokunmaz', () => {
    expect(excessSteps(6, list({ users: [{ id: 'a' }] as User[], unreadable: ['b'] }))).toBe(0);
  });

  it('sayaç eksik sayıyorsa artırmaz', () => {
    expect(excessSteps(2, list({ users: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as User[] }))).toBe(0);
  });

  it('tek seferde en fazla 10 adım iner', () => {
    expect(excessSteps(500, list())).toBe(10);
  });

  it('sayaç sayı değilse dokunmaz', () => {
    expect(excessSteps(Number.NaN, list())).toBe(0);
  });
});

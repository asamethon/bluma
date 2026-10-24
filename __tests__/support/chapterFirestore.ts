type Data = Record<string, any>;
type Ref = { path: string; id: string; firestore: object };
const database = {};
export const documents = new Map<string, Data>();
export const scenario = { failPublication: false, retryTransaction: false };
export const testStore = {
  user: { id: 'writer', displayName: 'Yazar' } as { id: string; displayName: string } | null,
  getState: () => ({ auth: { user: testStore.user } }),
  dispatch: jest.fn(),
};

function reference(parent: object, ...parts: string[]): Ref {
  const prefix = 'path' in parent ? String(parent.path) + '/' : '';
  const path = prefix + parts.join('/');
  return { path, id: path.split('/').at(-1)!, firestore: database };
}
function snapshot(ref: Ref) {
  const value = documents.get(ref.path);
  return { id: ref.id, ref, exists: () => !!value, data: () => value && { ...value } };
}
function writer() {
  const operations: (() => void)[] = [];
  const set = (ref: Ref, values: Data, merge: boolean) => operations.push(() => {
    const before = documents.get(ref.path) ?? {};
    const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key,
      value && typeof value === 'object' && '__increment' in value
        ? (before[key] ?? 0) + value.__increment : value,
    ]));
    documents.set(ref.path, { ...(merge ? before : {}), ...data });
  });
  return {
    get: async (ref: Ref) => snapshot(ref),
    set: (ref: Ref, values: Data, options?: { merge?: boolean }) => set(ref, values, !!options?.merge),
    update: (ref: Ref, values: Data) => set(ref, values, true),
    delete: (ref: Ref) => operations.push(() => { documents.delete(ref.path); }),
    commit: async () => { operations.forEach(operation => operation()); },
  };
}

export const firestoreMock = {
  getFirestore: () => database,
  collection: reference,
  doc: reference,
  serverTimestamp: () => 'server-time',
  increment: (amount: number) => ({ __increment: amount }),
  getDoc: jest.fn(async (ref: Ref) => snapshot(ref)),
  getDocs: jest.fn(async (ref: Ref) => ({ docs: [...documents.keys()]
    .filter(path => path.startsWith(ref.path + '/') && path.split('/').length === ref.path.split('/').length + 1)
    .map(path => snapshot(reference(database, path))),
  })),
  writeBatch: jest.fn(() => writer()),
  runTransaction: jest.fn(async (_db: object, operation: (transaction: ReturnType<typeof writer>) => Promise<unknown>) => {
    if (scenario.retryTransaction) await operation(writer());
    const transaction = writer();
    const result = await operation(transaction);
    if (scenario.failPublication) throw new Error('Yayın bağlantısı kesildi.');
    await transaction.commit();
    return result;
  }),
};

export function resetChapterDatabase() {
  documents.clear();
  testStore.user = { id: 'writer', displayName: 'Yazar' };
  scenario.failPublication = false;
  scenario.retryTransaction = false;
  documents.set('users/writer', { storiesCount: 0 });
  documents.set('stories/story', { authorId: 'writer', title: 'Test hikâyesi', isPublished: false, chaptersCount: 1 });
}

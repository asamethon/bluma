import { configureFirebaseEmulators } from '@/features/bootstrap/services/firebaseEmulators';
import * as environment from '@/constants/firebaseEnvironment';
import { getApp } from '@react-native-firebase/app';
import { connectAuthEmulator } from '@react-native-firebase/auth';
import { connectFirestoreEmulator } from '@react-native-firebase/firestore';

jest.mock('@/constants/firebaseEnvironment', () => ({ __esModule: true, isLocalFirebase: false }));
jest.mock('@react-native-firebase/app', () => ({ getApp: jest.fn() }));
jest.mock('@react-native-firebase/auth', () => ({ getAuth: () => 'auth', connectAuthEmulator: jest.fn() }));
jest.mock('@react-native-firebase/firestore', () => ({ getFirestore: () => 'db', connectFirestoreEmulator: jest.fn() }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo/virtual/env', () => ({ get env() { return process.env; } }));
const local = (value: boolean) => { Object.defineProperty(environment, 'isLocalFirebase', { value, configurable: true }); };
const project = (id: string) => jest.mocked(getApp).mockReturnValue({ options: { projectId: id } } as ReturnType<typeof getApp>);

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(globalThis, { __DEV__: true });
  local(false);
  project('bluma-dc10e');
});
it('normal uygulamanın Firebase bağlantısını değiştirmez', () => {
  configureFirebaseEmulators();
  expect(connectAuthEmulator).not.toHaveBeenCalled();
  expect(connectFirestoreEmulator).not.toHaveBeenCalled();
});
it('canlı native proje yerel moda geçirilmeye çalışılırsa açılışı durdurur', () => {
  local(true);
  expect(configureFirebaseEmulators).toThrow('demo Firebase');
  expect(connectAuthEmulator).not.toHaveBeenCalled();
});
it('demo uygulaması normal Metro ile başlatılırsa açılışı durdurur', () => {
  project('demo-bluma-local');
  expect(configureFirebaseEmulators).toThrow('local:start');
});
it('yayın derlemesinde yerel moda izin vermez', () => {
  local(true); project('demo-bluma-local');
  Object.assign(globalThis, { __DEV__: false });
  expect(configureFirebaseEmulators).toThrow('geliştirme uygulamasında');
});
it('demo uygulamasında Auth ve Firestore birlikte yerel adreslere bağlanır', () => {
  local(true); project('demo-bluma-local');
  configureFirebaseEmulators();
  expect(connectAuthEmulator).toHaveBeenCalledWith('auth', 'http://127.0.0.1:9099');
  expect(connectFirestoreEmulator).toHaveBeenCalledWith('db', '127.0.0.1', 8787);
});

it('yerel derleme farklı uygulama/URL kimliği ve sahte Firebase dosyaları kullanır', () => {
  const configure = jest.requireActual('../app.config.js');
  const config = jest.requireActual('../app.json').expo;
  const testEnvironment = jest.replaceProperty(process, 'env', { ...process.env, EXPO_PUBLIC_USE_FIREBASE_EMULATORS: '1' });
  try {
    const demo = configure({ config });
    expect(demo.slug).toBe('bluma-local');
    expect(demo.ios.bundleIdentifier).toBe('com.asamethon.bluma.local');
    expect(demo.ios.googleServicesFile).toContain('emulator.plist');
    expect(demo.android.package).toBe('com.d4tecompany.bluma.local');
    expect(jest.requireActual('node:fs').existsSync(demo.ios.googleServicesFile)).toBe(true);
    expect(jest.requireActual('node:fs').existsSync(demo.android.googleServicesFile)).toBe(true);
    expect(demo.updates.enabled).toBe(false);
    testEnvironment.replaceValue({ ...process.env, EXPO_PUBLIC_USE_FIREBASE_EMULATORS: '0' });
    const normal = configure({ config });
    expect(normal.slug).toBe(config.slug);
    expect(normal.ios.bundleIdentifier).toBe(config.ios.bundleIdentifier);
    expect(normal.ios.infoPlist).toEqual(config.ios.infoPlist);
  } finally {
    testEnvironment.restore();
  }
});

import { isLocalFirebase } from '@/constants/firebaseEnvironment';
import { getApp } from '@react-native-firebase/app';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

/** Router ve oturum servisleri yüklenmeden önce çalışır. Canlı projeye bağlanmaz. */
export function configureFirebaseEmulators() {
  const projectId = getApp().options.projectId;
  if (!isLocalFirebase) {
    if (projectId?.startsWith('demo-')) throw new Error('Yerel uygulamayı yarn local:start ile başlatmalısın.');
    return;
  }
  if (!__DEV__ || projectId !== 'demo-bluma-local') {
    throw new Error('Yerel test yalnızca demo Firebase ayarlı geliştirme uygulamasında çalışır. yarn local:ios kullan.');
  }
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST?.trim()
    || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
  if (!/^[\w.-]+$/.test(host)) throw new Error('Emülatör adresini protokol ve port olmadan yazmalısın.');
  connectAuthEmulator(getAuth(), `http://${host}:9099`);
  connectFirestoreEmulator(getFirestore(), host, 8787);
}

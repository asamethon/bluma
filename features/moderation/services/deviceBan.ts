import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { getDeviceId } from './deviceId';

/**
 * Cihaz banı — hesabı silinen tacizcinin yeni hesapla dönmesini engeller.
 *
 * `userDevices/{uid}` hesabı cihaza bağlar; herkese açık DEĞİLDİR (kural:
 * yalnızca admin okur), çünkü cihaz kimliği kişisel veridir. Ban listesi
 * `bannedDevices/{deviceId}` ise doğrudan okunabilir — ama yalnızca id'sini
 * bilerek (list yasak), yani kimse listeyi tarayamaz.
 */

export type DeviceBan = { reason?: string; bannedAt?: unknown };

/** Oturum açan hesabı cihaza bağlar. Ban, hesabı buradan bulur. */
export async function registerDevice(userId: string) {
  try {
    const deviceId = await getDeviceId();
    await setDoc(
      doc(getFirestore(), 'userDevices', userId),
      {
        userId,
        deviceId,
        platform: Platform.OS,
        model: Device.modelName || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    // Banlı cihazda kural bu yazmayı reddeder — beklenen durum, sessiz geç.
    logger.debug('Device register skipped:', error);
  }
}

/** Bu cihaz banlı mı? Banlıysa ban kaydını döner. */
export async function getDeviceBan(): Promise<DeviceBan | null> {
  try {
    const deviceId = await getDeviceId();
    const snap = await getDoc(doc(getFirestore(), 'bannedDevices', deviceId));
    return snap.exists() ? (snap.data() as DeviceBan) : null;
  } catch (error) {
    // Ağ hatasında kullanıcıyı yanlışlıkla kilitleme — banlı değil say.
    logger.error('Device ban check error:', error);
    return null;
  }
}

export const deviceBanActions = { registerDevice, getDeviceBan };

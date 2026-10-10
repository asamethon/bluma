import { privacyOf } from '@/features/privacy/types';
import { store } from '@/store';
import { collection, doc, getFirestore } from '@react-native-firebase/firestore';

// "Etkinlik Durumu" kapalıyken yazıyor göstergesi ve okundu filigranı
// karşı tarafa hiç gönderilmez.
export function activityVisible(): boolean {
  return privacyOf(store.getState().auth.user).showActivity;
}

/** İki kullanıcı için deterministik sohbet kimliği. */
export function threadIdFor(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export const threadRef = (threadId: string) =>
  doc(getFirestore(), 'messageThreads', threadId);

export const messagesRef = (threadId: string) =>
  collection(getFirestore(), 'messageThreads', threadId, 'messages');

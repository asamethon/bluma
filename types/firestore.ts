import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Firestore zaman alanı: sunucudan `Timestamp`, iyimser yazımda `Date`,
 * yazma anında `serverTimestamp()` (FieldValue) olarak gelebilir.
 */
export type FirestoreDate =
  | FirebaseFirestoreTypes.Timestamp
  | FirebaseFirestoreTypes.FieldValue
  | Date
  | number
  | string
  | null;

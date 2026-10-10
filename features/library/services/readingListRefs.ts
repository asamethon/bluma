import { collection, getFirestore } from '@react-native-firebase/firestore';

export const listsRef = (userId: string) =>
  collection(getFirestore(), 'users', userId, 'readingLists');

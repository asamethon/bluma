import { doc, getFirestore } from '@react-native-firebase/firestore';

export const db = () => getFirestore();

// Gizli hesaba takip isteği: users/{hedef}/followRequests/{isteyen}
export const requestRef = (ownerId: string, requesterId: string) =>
  doc(db(), 'users', ownerId, 'followRequests', requesterId);

export type FollowRequest = { id: string; createdAt?: unknown };

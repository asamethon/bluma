import { ConnectionsScreen } from '@/features/profile/components/ConnectionsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function FollowingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ConnectionsScreen profileId={id} initialTab="following" />;
}

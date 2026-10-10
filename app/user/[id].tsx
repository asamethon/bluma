import { UserProfileScreen } from '@/features/profile/components/UserProfileScreen';
import { useLocalSearchParams } from 'expo-router';

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserProfileScreen profileId={id} />;
}

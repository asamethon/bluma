import { BookLaunchScreen } from '@/features/launch/components/BookLaunchScreen';
import { useLocalSearchParams } from 'expo-router';

export default function BookLaunchRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookLaunchScreen storyId={String(id)} />;
}

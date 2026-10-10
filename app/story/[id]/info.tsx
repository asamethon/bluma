import { StoryInfoScreen } from '@/features/story/components/info/StoryInfoScreen';
import { useLocalSearchParams } from 'expo-router';

export default function StoryInfoRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StoryInfoScreen storyId={id} />;
}

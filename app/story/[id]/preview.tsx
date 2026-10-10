import { StoryPreviewScreen } from '@/features/story/components/preview/StoryPreviewScreen';
import { useLocalSearchParams } from 'expo-router';

export default function StoryPreviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StoryPreviewScreen storyId={String(id)} />;
}

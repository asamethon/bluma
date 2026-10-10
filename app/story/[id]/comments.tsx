import { CommentsScreen } from '@/features/story/components/comments/CommentsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function StoryCommentsRoute() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  return <CommentsScreen storyId={String(id)} chapter={chapter} />;
}

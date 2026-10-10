import { ReaderScreen } from '@/features/story/components/reader/ReaderScreen';
import { useLocalSearchParams } from 'expo-router';

export default function StoryReaderRoute() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  return <ReaderScreen storyId={String(id)} requestedChapter={chapter} />;
}

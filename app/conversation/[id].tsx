import { ConversationDetailScreen } from '@/features/conversation/components/ConversationDetailScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ConversationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ConversationDetailScreen conversationId={String(id)} />;
}

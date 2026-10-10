import { ChatScreen } from '@/features/messaging/components/chat/ChatScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // `key`: sohbet değişince besteci sıfırdan kurulur — iliştirilmiş bir
  // fotoğraf başka bir sohbete taşınamaz (iPad'de tek Slot yeniden kullanılır).
  return <ChatScreen key={id} threadId={id} />;
}

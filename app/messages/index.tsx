import { ThreadListPane } from '@/features/messaging/components/ThreadListPane';

// Mesajlar kutusu — sohbet listesi. Gerçek içerik ThreadListPane'de: telefonda
// burada tam ekran render edilir, tablette app/messages/_layout.tsx sol rayda
// aynı bileşeni kalıcı olarak gösterir.
export default function MessagesScreen() {
  return <ThreadListPane />;
}

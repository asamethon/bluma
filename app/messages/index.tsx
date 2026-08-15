import { EmptyThreadState } from '@/features/messaging/components/EmptyThreadState';
import { ThreadListPane } from '@/features/messaging/components/ThreadListPane';
import { useResponsive } from '@/hooks/useResponsive';

export default function MessagesScreen() {
  const { isTablet } = useResponsive();
  return isTablet ? <EmptyThreadState /> : <ThreadListPane />;
}

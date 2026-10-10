import { Screen } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import type { Notification } from '@/types';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { notificationStyles as styles } from '../styles/notificationStyles';
import { FollowRequestsBanner } from './FollowRequestsBanner';
import { NotificationHeader } from './NotificationHeader';
import { NotificationRow } from './NotificationRow';
import { NotificationEmptyState, NotificationGuestState } from './NotificationStates';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const state = useNotifications();
  const renderItem = useCallback<ListRenderItem<Notification>>(({ item }) => (
    <NotificationRow item={item} onPress={state.open} onDelete={state.delete} />
  ), [state.delete, state.open]);
  const screenStyle = [styles.container, { backgroundColor: colors.background }];

  if (state.isGuest || !state.currentUser) {
    return (
      <Screen style={screenStyle} maxContentWidth={ContentMaxWidth.content}>
        <NotificationHeader onBack={router.back} />
        <NotificationGuestState />
      </Screen>
    );
  }

  return (
    <Screen style={screenStyle} maxContentWidth={ContentMaxWidth.content}>
      <NotificationHeader unreadCount={state.unreadCount} onBack={router.back} onMarkAll={state.markAll} />
      <FlashList
        data={state.notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<FollowRequestsBanner count={state.requests.length} />}
        refreshControl={<RefreshControl refreshing={state.isLoading} onRefresh={state.refresh} tintColor={colors.primary} />}
        ListEmptyComponent={!state.isLoading ? <NotificationEmptyState /> : null}
      />
    </Screen>
  );
}

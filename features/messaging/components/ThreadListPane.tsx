import { EmptyState, PageHeader, Screen, TextField } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { ThreadRow } from '@/features/messaging/components/ThreadRow';
import { useMessageThreads } from '@/features/messaging/hooks/useMessageThreads';
import { useAppSelector } from '@/store/hooks';
import { MessageThread } from '@/types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ThreadListPane() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { threads, query, setQuery, totalUnread, confirmDelete } = useMessageThreads();

  const openChat = useCallback(
    (otherUserId: string) => router.push(`/messages/${otherUserId}` as any),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: MessageThread }) => (
      <ThreadRow
        thread={item}
        currentUserId={currentUserId}
        onPress={openChat}
        onLongPress={confirmDelete}
      />
    ),
    [currentUserId, openChat, confirmDelete]
  );

  return (
    <Screen edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <PageHeader
        title={t('messages.title')}
        subtitle={totalUnread > 0 ? t('messages.unreadCount', { count: totalUnread }) : t('messages.allCaughtUp')}
        onBack={() => router.back()}
        topInset={top}
        bordered={false}
      />

      <View style={{ paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.sm }}>
        <TextField
          icon="search"
          shape="pill"
          value={query}
          onChangeText={setQuery}
          placeholder={t('messages.searchPlaceholder')}
          returnKeyType="search"
        />
      </View>

      <FlashList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title={query ? t('messages.noMatch') : t('messages.noMessagesYet')}
          />
        }
      />
    </Screen>
  );
}

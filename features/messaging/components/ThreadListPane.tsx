import { IconButton, Screen, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { ThreadRow } from '@/features/messaging/components/ThreadRow';
import { useMessageThreads } from '@/features/messaging/hooks/useMessageThreads';
import { useAppSelector } from '@/store/hooks';
import { MessageThread } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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
    <Screen edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.screenX, paddingVertical: 12, paddingTop: top + 12 }}>
        <IconButton icon="arrow-back" glass onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text variant="heading">{t('messages.title')}</Text>
          <Text variant="caption" tone="textLight">
            {totalUnread > 0 ? t('messages.unreadCount', { count: totalUnread }) : t('messages.allCaughtUp')}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: Spacing.screenX, paddingBottom: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 42,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: colors.surfaceVariant,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search" size={17} color={colors.textLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('messages.searchPlaceholder')}
            placeholderTextColor={colors.textLight}
            style={{ flex: 1, fontSize: 14, lineHeight: 18, color: colors.text, padding: 0 }}
          />
        </View>
      </View>

      <FlashList
        data={threads}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: Spacing.screenX, paddingTop: 8, paddingBottom: 24 }}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 64 }} />
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: 20 }}>
            <Ionicons name="chatbubbles-outline" size={34} color={colors.primary} />
            <Text variant="body" tone="textLight" style={{ marginTop: 10, fontStyle: 'italic' }}>
              {query ? t('messages.noMatch') : t('messages.noMessagesYet')}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

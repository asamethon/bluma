import { IconButton, Screen, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { ThreadRow } from '@/features/messaging/components/ThreadRow';
import { useMessageThreads } from '@/features/messaging/hooks/useMessageThreads';
import { useAppSelector } from '@/store/hooks';
import { MessageThread } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, TextInput, View } from 'react-native';

/**
 * Sohbet listesi — hem telefonda tam ekran (app/messages/index.tsx) hem de
 * tablette master-detail düzeninin sol rayında (app/messages/_layout.tsx)
 * kullanılır, bu yüzden kendi Screen/güvenli alan sarmalayıcısını taşır.
 */
export function ThreadListPane() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { threads, query, setQuery, totalUnread } = useMessageThreads();

  const openChat = useCallback(
    (otherUserId: string) => router.push(`/messages/${otherUserId}` as any),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: MessageThread }) => (
      <ThreadRow thread={item} currentUserId={currentUserId} onPress={openChat} />
    ),
    [currentUserId, openChat]
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.screenX, paddingVertical: 12 }}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text variant="heading">Mesajlar</Text>
          <Text variant="caption" tone="textLight">
            {totalUnread > 0 ? `${totalUnread} okunmamış` : 'Hepsi güncel'}
          </Text>
        </View>
      </View>

      {/* Search */}
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
            placeholder="Sohbetlerde ara"
            placeholderTextColor={colors.textLight}
            style={{ flex: 1, fontSize: 14, lineHeight: 18, color: colors.text, padding: 0 }}
          />
        </View>
      </View>

      <FlatList
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
              {query ? 'Eşleşen bir sohbet yok.' : 'Henüz mesajın yok.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

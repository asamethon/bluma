import { Avatar, Text } from '@/components/ui';
import { Radius, useTheme } from '@/constants/theme';
import { useShareRecipients } from '@/features/messaging/hooks/useShareRecipients';
import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { SharedStory, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

export function ShareStorySheet({
  visible,
  onClose,
  story,
  onShareLink,
  safeBottom,
}: {
  visible: boolean;
  onClose: () => void;
  story: SharedStory | null;
  onShareLink: () => void;
  safeBottom: number;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { recipients, loading } = useShareRecipients();
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});

  const sendToUser = useCallback(
    (user: User) => {
      if (!currentUserId || !story || sentTo[user.id]) return;
      setSentTo((prev) => ({ ...prev, [user.id]: true }));
      messagingActions.sendStory(currentUserId, user.id, story).catch(() => {
        setSentTo((prev) => ({ ...prev, [user.id]: false }));
      });
    },
    [currentUserId, story, sentTo]
  );

  const renderItem = useCallback(
    ({ item }: { item: User }) => {
      const sent = sentTo[item.id];
      return (
        <Pressable
          onPress={() => sendToUser(item)}
          disabled={sent}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
        >
          <Avatar uri={item.profileImage} name={item.displayName} size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
              {item.displayName || t('common.user')}
            </Text>
            {item.username ? (
              <Text variant="caption" tone="textLight" numberOfLines={1}>@{item.username}</Text>
            ) : null}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: sent ? colors.surfaceVariant : colors.primary,
            }}
          >
            <Ionicons
              name={sent ? 'checkmark' : 'paper-plane'}
              size={14}
              color={sent ? colors.textLight : colors.onPrimary}
            />
            <Text variant="caption" color={sent ? colors.textLight : colors.onPrimary} style={{ fontWeight: '700' }}>
              {sent ? t('messages.sent') : t('messages.send')}
            </Text>
          </View>
        </Pressable>
      );
    },
    [sentTo, sendToUser, colors]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={[s.content, { backgroundColor: colors.surface, paddingBottom: safeBottom + 16 }]}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
          <Text variant="subheading" style={{ textAlign: 'center', marginBottom: 14 }}>{t('messages.share')}</Text>

          <Pressable
            onPress={() => { onClose(); onShareLink(); }}
            style={[s.linkRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
          >
            <View style={[s.linkIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="share-social" size={20} color={colors.primary} />
            </View>
            <Text variant="body" style={{ flex: 1, fontWeight: '600' }}>{t('messages.shareLink')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </Pressable>

          <Text variant="caption" tone="textLight" style={{ fontWeight: '700', marginTop: 18, marginBottom: 4 }}>
            {t('messages.sendViaMessage')}
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 28 }} />
          ) : recipients.length === 0 ? (
            <Text variant="body" tone="textLight" style={{ textAlign: 'center', paddingVertical: 24, fontStyle: 'italic' }}>
              {t('messages.noFollowingYet')}
            </Text>
          ) : (
            <FlashList
              data={recipients}
              keyExtractor={(u) => u.id}
              renderItem={renderItem}
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  content: { paddingHorizontal: 20, paddingTop: 10, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

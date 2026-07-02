import {
  Screen, Avatar, BloomMark, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { authState$ } from '@/store/authStore';
import { notificationActions, notificationState$ } from '@/store/notificationStore';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

/* ── Notification type helpers ─────────────────────────────────────────── */
const TYPE_META: Record<string, { icon: string; color: string }> = {
  follow:          { icon: 'person-add',          color: '#7C5CD0' },
  like:            { icon: 'heart',               color: '#FF5C8A' },
  comment:         { icon: 'chatbubble-ellipses', color: '#2196F3' },
  mention:         { icon: 'at',                  color: '#E6B95C' },
  welcome:         { icon: 'sparkles',            color: '#E6B95C' },
  story_published: { icon: 'book',                color: '#4CAF50' },
  new_chapter:     { icon: 'library',             color: '#4CAF50' },
};

function metaFor(type: string) {
  return TYPE_META[type] ?? { icon: 'notifications', color: '#7C5CD0' };
}

function timeAgo(timestamp: any): string {
  if (!timestamp) return '';
  const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'Şimdi';
  if (mins < 60) return `${mins} dk`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} g`;
  return `${Math.floor(days / 7)} hf`;
}

/* ── Single notification row ───────────────────────────────────────────── */
function NotifRow({ item, onPress, onDelete, colors, fonts }: any) {
  const meta = metaFor(item.type);
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: item.isRead ? colors.background : colors.primarySoft + '60' },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* icon / avatar */}
      <View style={styles.iconWrap}>
        {item.senderAvatar ? (
          <View>
            <Avatar uri={item.senderAvatar} name={item.senderName} size={42} />
            <View style={[styles.typeBadge, { backgroundColor: meta.color }]}>
              <Ionicons name={meta.icon as any} size={10} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: meta.color + '18' }]}>
            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
          </View>
        )}
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>

      {/* text */}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sans }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: colors.textLight }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>

      {/* delete */}
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
        <Ionicons name="close" size={15} color={colors.textLight} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/* ── Empty state ───────────────────────────────────────────────────────── */
function EmptyState({ colors, fonts }: any) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="notifications-off-outline" size={32} color={colors.textLight} />
      </View>
      <Text style={[styles.emptyTitle, { fontFamily: fonts.serif, color: colors.text }]}>
        Henüz bildirimin yok
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
        Yeni aktiviteler burada görünecek
      </Text>
    </View>
  );
}

/* ── Guest / unauthenticated state ─────────────────────────────────────── */
function NotifGuestState({ colors, fonts, startAuth }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={[{ width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="notifications-outline" size={36} color={colors.primary} />
      </View>
      <Text style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
        Bildirimler burada
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
        Beğeni, yorum ve takip bildirimlerini görmek için giriş yap.
      </Text>
      <TouchableOpacity
        style={{ height: 50, paddingHorizontal: 28, borderRadius: 999, backgroundColor: '#FF5C8A', flexDirection: 'row', alignItems: 'center', gap: 8 }}
        onPress={() => startAuth('signup')}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Hesap Oluştur</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 14 }} onPress={() => startAuth('login')}>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Zaten hesabın var mı? Giriş yap</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Screen ────────────────────────────────────────────────────────────── */
export default observer(function NotificationsScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const { startAuth } = useGuestGate();
  const unsubRef = useRef<(() => void) | null>(null);
  const { isGuest } = authState$.get();
  const currentUser = authState$.user.get();
  const { notifications, isLoading, unreadCount } = notificationState$.get();

  // Hook'lar her render'da aynı sırada çağrılmalı — bu useEffect erken
  // return'den ÖNCE durmalı (misafir → giriş geçişinde hook sırası bozuluyordu).
  useEffect(() => {
    if (!currentUser?.id) return;
    notificationActions.initializeNotifications(currentUser.id).then(unsub => {
      if (unsub) unsubRef.current = unsub;
    });
    return () => { unsubRef.current?.(); };
  }, [currentUser?.id]);

  if (isGuest || !currentUser) {
    return (
      <Screen style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.heading, { fontFamily: fonts.serif, color: colors.text }]}>Bildirimler</Text>
        </View>
        <NotifGuestState colors={colors} fonts={fonts} startAuth={startAuth} />
      </Screen>
    );
  }

  const handlePress = async (item: any) => {
    await notificationActions.markAsRead(item.id);
    switch (item.type) {
      case 'follow':
        if (item.data?.followerId) router.push(`/user/${item.data.followerId}`);
        break;
      case 'like':
      case 'comment':
      case 'mention':
        if (item.data?.conversationId) router.push(`/conversation/${item.data.conversationId}`);
        else if (item.data?.storyId) router.push(`/story/${item.data.storyId}`);
        break;
      case 'story_published':
        // Yeni hikâye → önce tanıtım/önizleme ekranı
        if (item.data?.storyId) router.push(`/story/${item.data.storyId}/preview`);
        break;
      case 'new_chapter':
        // Yeni bölüm → doğrudan o bölümden okumaya başla
        if (item.data?.storyId) {
          const ch = item.data?.chapterNumber ? Number(item.data.chapterNumber) - 1 : 0;
          router.push(`/story/${item.data.storyId}?chapter=${ch}` as any);
        }
        break;
    }
  };

  return (
    <Screen style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.heading, { fontFamily: fonts.serif, color: colors.text }]}>
          Bildirimler
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => currentUser?.id && notificationActions.markAllAsRead(currentUser.id)}
            style={[styles.markAllBtn, { backgroundColor: colors.primarySoft }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
              Tümünü okundu işaretle
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotifRow
            item={item}
            onPress={handlePress}
            onDelete={notificationActions.deleteNotification}
            colors={colors}
            fonts={fonts}
          />
        )}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => currentUser?.id && notificationActions.initializeNotifications(currentUser.id)}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border, marginLeft: 72 }]} />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState colors={colors} fonts={fonts} /> : null}
      />
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heading: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, lineHeight: 32 },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill,
  },

  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenX, paddingVertical: 14, gap: 12,
  },
  iconWrap: { position: 'relative' },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute', right: -3, bottom: -3,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 9, height: 9, borderRadius: 5,
    borderWidth: 2, borderColor: '#fff',
  },

  textBlock: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  message: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, fontWeight: '600' },

  deleteBtn: { padding: 4, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 100, paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 6,
  },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

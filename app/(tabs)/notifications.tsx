import { Screen, Avatar, Text } from "@/components/ui";
import { ContentMaxWidth, Radius, Spacing, useTheme } from "@/constants/theme";
import { useGuestGate } from "@/contexts/GuestContext";
import { useAppSelector } from "@/store/hooks";
import { notificationActions } from "@/store/notificationStore";
import { useFollowRequests } from "@/features/social/hooks/useFollowRequests";
import { localizeNotification } from "@/features/notifications/utils/localizeNotification";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from '@shopify/flash-list';

const TYPE_META: Record<string, { icon: string; color: string }> = {
  follow: { icon: "person-add", color: "#7C5CD0" },
  follow_request: { icon: "person-add", color: "#7C5CD0" },
  follow_accepted: { icon: "checkmark-circle", color: "#4CAF50" },
  like: { icon: "heart", color: "#FF5C8A" },
  comment: { icon: "chatbubble-ellipses", color: "#2196F3" },
  mention: { icon: "at", color: "#E6B95C" },
  welcome: { icon: "sparkles", color: "#E6B95C" },
  story_published: { icon: "book", color: "#4CAF50" },
  new_chapter: { icon: "library", color: "#4CAF50" },
};

function metaFor(type: string) {
  return TYPE_META[type] ?? { icon: "notifications", color: "#7C5CD0" };
}

function timeAgo(timestamp: any): string {
  if (!timestamp) return "";
  const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return i18n.t("time.now");
  if (mins < 60) return i18n.t("time.minutesShort", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return i18n.t("time.hoursShort", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return i18n.t("time.daysShort", { count: days });
  return i18n.t("time.weeksShort", { count: Math.floor(days / 7) });
}

const NotifRow = React.memo(function NotifRow({
  item,
  title,
  message,
  onPress,
  onDelete,
  colors,
  fonts,
}: any) {
  const meta = metaFor(item.type);
  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: item.isRead
            ? colors.background
            : colors.primarySoft + "60",
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        {item.senderAvatar ? (
          <View>
            <Avatar uri={item.senderAvatar} name={item.senderName} size={42} />
            <View style={[styles.typeBadge, { backgroundColor: meta.color }]}>
              <Ionicons name={meta.icon as any} size={10} color="#fff" />
            </View>
          </View>
        ) : (
          <View
            style={[styles.iconCircle, { backgroundColor: meta.color + "18" }]}
          >
            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
          </View>
        )}
        {!item.isRead && (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.primary }]}
          />
        )}
      </View>

      <View style={styles.textBlock}>
        <Text
          style={[styles.title, { color: colors.text, fontFamily: fonts.sans }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.message, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {message}
        </Text>
        <Text style={[styles.time, { color: colors.textLight }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        style={styles.deleteBtn}
        hitSlop={8}
      >
        <Ionicons name="close" size={15} color={colors.textLight} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

function EmptyState({ colors, fonts }: any) {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.surfaceVariant }]}
      >
        <Ionicons
          name="notifications-off-outline"
          size={32}
          color={colors.textLight}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { fontFamily: fonts.serif, color: colors.text },
        ]}
      >
        {t("notifications.emptyTitle")}
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
        {t("notifications.emptySub")}
      </Text>
    </View>
  );
}

function NotifGuestState({ colors, fonts, startAuth }: any) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <View
        style={[
          {
            width: 80,
            height: 80,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          },
          { backgroundColor: colors.primarySoft },
        ]}
      >
        <Ionicons
          name="notifications-outline"
          size={36}
          color={colors.primary}
        />
      </View>
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 22,
          lineHeight: 31,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {t("notifications.guestTitle")}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 24,
        }}
      >
        {t("notifications.guestSub")}
      </Text>
      <TouchableOpacity
        style={{
          height: 50,
          paddingHorizontal: 28,
          borderRadius: 999,
          backgroundColor: "#FF5C8A",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
        onPress={() => startAuth("signup")}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "700",
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {t("walkthrough.createAccount")}
        </Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginTop: 14 }}
        onPress={() => startAuth("login")}
      >
        <Text
          style={{
            color: colors.primary,
            fontWeight: "700",
            fontSize: 14,
            lineHeight: 18,
          }}
        >
          {t("guest.alreadyHaveAccount")} {t("guest.signIn")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationsScreen() {
  const { colors, fonts } = useTheme();
  const { t, i18n: i18nInstance } = useTranslation();
  const language = i18nInstance.language;
  const router = useRouter();
  const { startAuth } = useGuestGate();
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const currentUser = useAppSelector((s) => s.auth.user);
  const notifications = useAppSelector((s) => s.notification.notifications);
  const isLoading = useAppSelector((s) => s.notification.isLoading);
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);
  const { requests: followRequests } = useFollowRequests();

  useEffect(() => {
    if (!currentUser?.id) return;
    notificationActions.initializeNotifications(currentUser.id);
  }, [currentUser?.id]);

  const handlePress = useCallback(
    async (item: any) => {
      await notificationActions.markAsRead(item.id);
      switch (item.type) {
        case "follow_request":
          router.push("/profile/follow-requests" as any);
          break;
        case "follow":
        case "follow_accepted":
          if (item.data?.followerId)
            router.push(`/user/${item.data.followerId}`);
          break;
        case "like":
        case "comment":
        case "mention":
          if (item.data?.conversationId)
            router.push(`/conversation/${item.data.conversationId}`);
          else if (item.data?.storyId)
            router.push(`/story/${item.data.storyId}`);
          break;
        case "story_published":
          if (item.data?.storyId)
            router.push(`/story/${item.data.storyId}/preview`);
          break;
        case "verify_email":
          router.push("/profile/verify-email" as any);
          break;
        case "new_chapter":
          if (item.data?.storyId) {
            const ch = item.data?.chapterNumber
              ? Number(item.data.chapterNumber) - 1
              : 0;
            router.push(`/story/${item.data.storyId}?chapter=${ch}` as any);
          }
          break;
      }
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      // Metin gönderenin değil, okuyanın dilinde üretilir (eskilerde yazılı metne düşer).
      const { title, message } = localizeNotification(item);
      return (
        <NotifRow
          item={item}
          title={title}
          message={message}
          onPress={handlePress}
          onDelete={notificationActions.deleteNotification}
          colors={colors}
          fonts={fonts}
        />
      );
    },
    // `language`: metin i18n'den geldiği için dil değişiminde satırlar yeniden çizilmeli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handlePress, colors, fonts, language],
  );

  if (isGuest || !currentUser) {
    return (
      <Screen
        style={[styles.container, { backgroundColor: colors.background }]}
        maxContentWidth={ContentMaxWidth.content}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text
            style={[
              styles.heading,
              { fontFamily: fonts.serif, color: colors.text },
            ]}
          >
            {t("notifications.title")}
          </Text>
        </View>
        <NotifGuestState colors={colors} fonts={fonts} startAuth={startAuth} />
      </Screen>
    );
  }

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      maxContentWidth={ContentMaxWidth.content}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text
          style={[
            styles.heading,
            { fontFamily: fonts.serif, color: colors.text },
          ]}
        >
          {t("notifications.title")}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() =>
              currentUser?.id &&
              notificationActions.markAllAsRead(currentUser.id)
            }
            style={[styles.markAllBtn, { backgroundColor: colors.primarySoft }]}
          >
            <Text
              style={{
                fontSize: 12,
                lineHeight: 16,
                fontWeight: "700",
                color: colors.primary,
              }}
            >
              {t("notifications.markAllRead")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          followRequests.length > 0 ? (
            <TouchableOpacity
              style={[styles.requestsRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/profile/follow-requests" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}
              >
                <Ionicons name="person-add" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.sans }]}>
                  {t("followRequests.title")}
                </Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  {t("followRequests.pendingCount", { count: followRequests.length })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() =>
              currentUser?.id &&
              notificationActions.initializeNotifications(currentUser.id)
            }
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: colors.border, marginLeft: 72 },
            ]}
          />
        )}
        ListEmptyComponent={
          !isLoading ? <EmptyState colors={colors} fonts={fonts} /> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenX,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: { position: "relative" },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },

  textBlock: { flex: 1 },
  title: { fontSize: 14, lineHeight: 18, fontWeight: "600", marginBottom: 2 },
  message: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, lineHeight: 14, fontWeight: "600" },

  deleteBtn: { padding: 4, marginTop: 2 },
  requestsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  separator: { height: StyleSheet.hairlineWidth },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});

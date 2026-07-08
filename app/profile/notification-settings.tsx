import { Screen, Switch, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { pushNotificationService } from '@/services/pushNotificationService';
import { notificationActions } from '@/store/notificationStore';
import { useAppSelector } from '@/store/hooks';
import { NotificationSettings } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const DEFAULTS: Omit<NotificationSettings, 'userId' | 'updatedAt'> = {
  pushNotifications: true,
  emailNotifications: false,
  storyNotifications: true,
  likeNotifications: true,
  commentNotifications: true,
  followNotifications: true,
  mentionNotifications: true,
};

type Row = { key: keyof typeof DEFAULTS; icon: keyof typeof Ionicons.glyphMap; title: string; caption: string };

const CHANNELS: Row[] = [
  { key: 'pushNotifications', icon: 'notifications-outline', title: 'Push Bildirimleri', caption: 'Telefonuna anlık bildirim gönderelim' },
  { key: 'emailNotifications', icon: 'mail-outline', title: 'E-posta Bildirimleri', caption: 'Önemli güncellemeleri e-posta ile al' },
];

const ACTIVITY: Row[] = [
  { key: 'storyNotifications', icon: 'book-outline', title: 'Yeni Bölüm', caption: 'Takip ettiğin yazarlar bölüm yayınlayınca' },
  { key: 'likeNotifications', icon: 'heart-outline', title: 'Beğeniler', caption: 'Hikayelerin beğeni aldığında' },
  { key: 'commentNotifications', icon: 'chatbubble-ellipses-outline', title: 'Yorumlar', caption: 'İçeriklerine yorum yapıldığında' },
  { key: 'followNotifications', icon: 'person-add-outline', title: 'Yeni Takipçi', caption: 'Biri seni takip etmeye başladığında' },
];

// Bildirim tercihleri Redux/Firestore üzerinden (notificationStore) yönetilir
// — burada sadece AsyncStorage'a değil, gönderim tarafının da okuduğu
// notificationSettings/{userId} dokümanına yazılır (bkz. pushNotificationService).
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAppSelector(s => s.auth);
  const settings = useAppSelector(s => s.notification.settings);
  const styles = createStyles(colors);

  useEffect(() => {
    if (user?.id) notificationActions.loadNotificationSettings(user.id);
  }, [user?.id]);

  const state = { ...DEFAULTS, ...settings };

  const toggle = (key: keyof typeof DEFAULTS, value: boolean) => {
    if (!user?.id) return;
    notificationActions.updateNotificationSettings(user.id, { [key]: value });

    // Push'u açarken cihaz token'ını kaydet (izin isteği dahil).
    if (key === 'pushNotifications' && value) {
      pushNotificationService.saveUserPushToken(user.id).catch(() => {});
    }
  };

  const pushOff = !state.pushNotifications;

  const renderRow = (row: Row, disabled: boolean) => (
    <View style={[styles.row, disabled && { opacity: 0.45 }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={row.icon} size={19} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{row.title}</Text>
        <Text variant="caption" tone="textLight">{row.caption}</Text>
      </View>
      <Switch checked={state[row.key]} onChange={v => toggle(row.key, v)} disabled={disabled} />
    </View>
  );

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="subheading">Bildirimler</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="overline" tone="textLight" style={styles.sectionLabel}>Kanallar</Text>
        <View style={styles.card}>
          {CHANNELS.map((row, i) => (
            <React.Fragment key={row.key}>
              {i > 0 && <View style={styles.divider} />}
              {renderRow(row, false)}
            </React.Fragment>
          ))}
        </View>

        <Text variant="overline" tone="textLight" style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>
          Etkinlik
        </Text>
        <View style={styles.card}>
          {ACTIVITY.map((row, i) => (
            <React.Fragment key={row.key}>
              {i > 0 && <View style={styles.divider} />}
              {renderRow(row, pushOff)}
            </React.Fragment>
          ))}
        </View>

        {pushOff && (
          <View style={[styles.note, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text variant="caption" tone="textSecondary" style={{ flex: 1 }}>
              Etkinlik bildirimlerini açmak için önce Push Bildirimlerini etkinleştir.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerIcon: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
    sectionLabel: { marginBottom: Spacing.sm, marginLeft: Spacing.xs },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: Spacing.lg },
    note: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'flex-start',
      padding: Spacing.lg,
      borderRadius: Radius.md,
      marginTop: Spacing.lg,
    },
  });

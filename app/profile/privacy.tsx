import { Screen, Switch, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { authState$ } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type PrivacyState = {
  privateAccount: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  discoverable: boolean;
};

const DEFAULTS: PrivacyState = {
  privateAccount: false,
  showActivity: true,
  allowMessages: true,
  discoverable: true,
};

const ROWS: { key: keyof PrivacyState; icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }[] = [
  { key: 'privateAccount', icon: 'lock-closed-outline', title: 'Gizli Hesap', caption: 'Hikayelerini ve profilini yalnızca takipçilerin görebilir' },
  { key: 'showActivity', icon: 'pulse-outline', title: 'Etkinlik Durumu', caption: 'Çevrimiçi olduğun ve son görülme bilgisi gösterilsin' },
  { key: 'allowMessages', icon: 'chatbubble-ellipses-outline', title: 'Mesajlara İzin Ver', caption: 'Herkes sana mesaj gönderebilsin' },
  { key: 'discoverable', icon: 'search-outline', title: 'Aramada Göster', caption: 'Profilin arama sonuçlarında ve önerilerde çıksın' },
];

export default observer(function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = authState$.get();
  const styles = createStyles(colors);

  const storageKey = `privacySettings:${user?.id ?? 'guest'}`;
  const [state, setState] = useState<PrivacyState>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {}
    })();
  }, [storageKey]);

  const toggle = async (key: keyof PrivacyState, value: boolean) => {
    const nextState = { ...state, [key]: value };
    setState(nextState);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
    } catch {}
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="subheading">Gizlilik</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="body" tone="textSecondary" style={{ marginBottom: Spacing.lg }}>
          Profilinin ve içeriklerinin kimler tarafından görülebileceğini buradan yönetebilirsin.
        </Text>

        <View style={styles.card}>
          {ROWS.map((row, i) => (
            <React.Fragment key={row.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={row.icon} size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{row.title}</Text>
                  <Text variant="caption" tone="textLight">{row.caption}</Text>
                </View>
                <Switch checked={state[row.key]} onChange={v => toggle(row.key, v)} />
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text variant="caption" tone="textSecondary" style={{ flex: 1 }}>
            Engellenen hesapları ve veri taleplerini Yardım & Destek bölümünden yönetebilirsin.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
});

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

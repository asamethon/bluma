import { useTheme } from "@/constants/theme";
import { authActions } from "@/store/authStore";
import { useAppSelector } from "@/store/hooks";
import { preferencesActions } from "@/store/preferencesStore";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Screen } from '@/components/ui';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  // Redux'tan okunur; setShowMatureContent optimistic dispatch ettiği için
  // ayrı lokal state gerekmez.
  const matureEnabled = useAppSelector(s => s.preferences.showMatureContent);

  useEffect(() => {
    preferencesActions.load();
  }, []);

  const handleToggleMature = (value: boolean) => {
    preferencesActions.setShowMatureContent(value);
  };

  const handleSignOut = () => {
    Alert.alert("Çıkış Yap", "Hesabından çıkış yapmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: () => {
          authActions.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/profile/edit")}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>Profili Düzenle</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={handleSignOut}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={colors.error || "#E53935"}
                />
                <Text
                  style={[
                    styles.rowTitle,
                    { color: colors.error || "#E53935" },
                  ]}
                >
                  Çıkış Yap
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={() => router.push("/profile/notification-settings")}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>Bildirim Tercihleri</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İçerik</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowNoBorder]}>
              <View style={[styles.rowLeft, { flex: 1, paddingRight: 12 }]}>
                <Ionicons name="warning-outline" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Olgun içeriği göster (18+)</Text>
                  <Text style={styles.rowSub}>Yetişkin olarak işaretlenmiş hikâyeleri keşfette göster</Text>
                </View>
              </View>
              <Switch value={matureEnabled} onValueChange={handleToggleMature} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hakkında</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/help" as any)}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>Yardım & Destek</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.row,
                styles.rowNoBorder,
                { justifyContent: "space-between" },
              ]}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>Sürüm</Text>
              </View>
              <Text style={styles.version}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    headerIcon: { padding: 6 },
    headerTitle: {
      flex: 1,
      textAlign: "left",
      fontSize: 24, lineHeight: 31,
      fontWeight: "800",
      color: colors.text,
      marginLeft: 8,
    },
    section: { paddingHorizontal: 16, paddingTop: 16 },
    sectionTitle: {
      fontSize: 14, lineHeight: 18,
      fontWeight: "700",
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowNoBorder: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowTitle: {
      marginLeft: 6,
      color: colors.text,
      fontWeight: "600",
      fontSize: 15, lineHeight: 20,
    },
    rowSub: {
      marginLeft: 6,
      marginTop: 2,
      color: colors.textSecondary,
      fontSize: 12, lineHeight: 16,
    },
    version: { color: colors.textSecondary, fontWeight: "600" },
  });

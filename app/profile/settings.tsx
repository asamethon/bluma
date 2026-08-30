import { useTheme } from "@/constants/theme";
import { authActions } from "@/store/authStore";
import { useAppSelector } from "@/store/hooks";
import { preferencesActions } from "@/store/preferencesStore";
import { reviewPromptActions } from "@/features/review/services/reviewPrompt";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, setAppLanguage, type AppLanguage } from "@/i18n";
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

const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
  ar: 'العربية',
  de: 'Deutsch',
  pt: 'Português',
  'pt-BR': 'Português (Brasil)',
  id: 'Bahasa Indonesia',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const matureEnabled = useAppSelector(s => s.preferences.showMatureContent);
  // Doğrulama yalnızca parola ile açılan hesaplar için anlamlı; Google/Apple
  // adresleri sağlayıcı tarafından doğrulanmış gelir.
  const isEmailAccount = useAppSelector(s => s.auth.user?.authProvider) === 'email';

  useEffect(() => {
    preferencesActions.load();
  }, []);

  const handleToggleMature = (value: boolean) => {
    preferencesActions.setShowMatureContent(value);
  };

  const handleSignOut = () => {
    Alert.alert(t('profileScreen.signOut'), t('profileScreen.signOutConfirm'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('profileScreen.signOut'),
        style: "destructive",
        onPress: () => {
          authActions.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleRateApp = async () => {
    const opened = await reviewPromptActions.openStoreListing();
    if (!opened) Alert.alert(t('common.error'), t('settings.rateUsFailed'));
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
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.accountSection')}</Text>
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
                <Text style={styles.rowTitle}>{t('profileScreen.editProfile')}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {isEmailAccount && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/profile/verify-email" as any)}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                  <Text style={styles.rowTitle}>{t('emailVerify.screenTitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

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
                  {t('profileScreen.signOut')}
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
          <Text style={styles.sectionTitle}>{t('notifications.title')}</Text>
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
                <Text style={styles.rowTitle}>{t('settings.notificationPrefs')}</Text>
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
          <Text style={styles.sectionTitle}>{t('settings.languageSection')}</Text>
          <View style={styles.card}>
            {SUPPORTED_LANGUAGES.map((lang, i) => (
              <TouchableOpacity
                key={lang}
                style={[styles.row, i === SUPPORTED_LANGUAGES.length - 1 && styles.rowNoBorder]}
                onPress={() => setAppLanguage(lang)}
              >
                <View style={styles.rowLeft}>
                  <Ionicons
                    name={i18n.language === lang ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={i18n.language === lang ? colors.primary : colors.textSecondary}
                  />
                  <Text style={styles.rowTitle}>{LANGUAGE_NAMES[lang]}</Text>
                </View>
                {i18n.language === lang && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.contentSection')}</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowNoBorder]}>
              <View style={[styles.rowLeft, { flex: 1, paddingRight: 12 }]}>
                <Ionicons name="warning-outline" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t('settings.matureContent')}</Text>
                  <Text style={styles.rowSub}>{t('settings.matureContentSub')}</Text>
                </View>
              </View>
              <Switch value={matureEnabled} onValueChange={handleToggleMature} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.aboutSection')}</Text>
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
                <Text style={styles.rowTitle}>{t('help.title')}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {/* Elle değerlendirme: sistem diyaloğu kotalı olduğu için burada
                doğrudan mağaza sayfası açılır. */}
            <TouchableOpacity style={styles.row} onPress={handleRateApp}>
              <View style={styles.rowLeft}>
                <Ionicons name="star-outline" size={20} color={colors.primary} />
                <Text style={styles.rowTitle}>{t('settings.rateUs')}</Text>
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
                <Text style={styles.rowTitle}>{t('settings.version')}</Text>
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

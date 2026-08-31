import { SUPPORT_EMAIL } from '@/constants/config';
import { authActions } from "@/store/authStore";
import { useTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IconButton, Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/legal';
import { logger } from '@/utils/logger';

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  { q: 'help.faq1q', a: 'help.faq1a' },
  { q: 'help.faq2q', a: 'help.faq2a' },
  { q: 'help.faq3q', a: 'help.faq3a' },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const openMail = async () => {
    const email = SUPPORT_EMAIL;
    const subject = encodeURIComponent(t('help.supportSubject'));
    const url = `mailto:${email}?subject=${subject}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
  };


  const handleDeleteAccount = () => {
    if (!currentUser) {
      Alert.alert(t('common.error'), t('errors.userNotFound'));
      return;
    }

    if (currentUser.authProvider === 'email') {
      setShowDeleteModal(true);
    } else {
      Alert.alert(
        t('help.deleteAccount'),
        t('help.deleteAccountConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('help.deleteAccount'), 
            style: 'destructive',
            onPress: () => performDeleteAccount(),
          },
        ]
      );
    }
  };

  const performDeleteAccount = async (password?: string) => {
    try {
      setIsDeleting(true);
      const result = await authActions.deleteAccount(password);
      
      if (result.success) {
        Alert.alert(
          t('help.accountDeletedTitle'),
          t('help.accountDeletedMessage'),
          [{ text: t('common.ok') }]
        );
        setShowDeleteModal(false);
      } else {
        Alert.alert(t('common.error'), result.error || t('account.deleteFailed'));
      }
    } catch (error) {
      logger.error('Delete account error:', error);
      Alert.alert(t('common.error'), t('account.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteModalSubmit = () => {
    if (!deletePassword.trim()) {
      Alert.alert(t('common.error'), t('help.enterPassword'));
      return;
    }
    performDeleteAccount(deletePassword.trim());
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton icon="chevron-back" iconSize={24} glass onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.faqSection')}</Text>
          <View style={styles.card}>
            {FAQS.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.row,
                  idx === FAQS.length - 1 && styles.rowNoBorder,
                  { flexDirection: "column" },
                ]}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                  onPress={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="help-circle-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.rowTitle}>{t(item.q)}</Text>
                  </View>

                  <Ionicons
                    name={openIndex === idx ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {openIndex === idx && (
                  <Text style={styles.faqAnswer}>{t(item.a)}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.contactSection')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={openMail}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>{t('help.emailSupport')}</Text>
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
          <Text style={styles.sectionTitle}>{t('help.legalSection')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={openPrivacyPolicy}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>{t('legal.privacyPolicy')}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={openTermsOfService}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>{t('legal.terms')}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {currentUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('help.accountSection')}</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.row, styles.rowNoBorder, styles.dangerRow]}
                onPress={handleDeleteAccount}
              >
                <View style={styles.rowLeft}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text style={[styles.rowTitle, styles.dangerText]}>{t('help.deleteAccount')}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Screen style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('help.deleteAccount')}</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={48} color={colors.warning} />
              <Text style={styles.warningTitle}>{t('help.warningTitle')}</Text>
              <Text style={styles.warningText}>
                {t('help.warningText')}
              </Text>
            </View>

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>{t('help.enterPasswordLabel')}</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('help.passwordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDeleteModalSubmit}
              disabled={isDeleting || !deletePassword.trim()}
            >
              {isDeleting ? (
                <Text style={styles.deleteButtonText}>{t('help.deleting')}</Text>
              ) : (
                <Text style={styles.deleteButtonText}>{t('help.deletePermanently')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Screen>
      </Modal>
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
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowNoBorder: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowTitle: {
      marginLeft: 6,
      color: colors.text,
      fontWeight: "600",
      fontSize: 15, lineHeight: 20,
    },
    faqAnswer: {
      marginTop: 8,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    dangerRow: {
      borderColor: colors.error,
      backgroundColor: colors.error + '10',
    },
    dangerText: {
      color: colors.error,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalCancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    modalCancelText: {
      fontSize: 16, lineHeight: 21,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    modalTitle: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '600',
      color: colors.text,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    warningContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 20,
    },
    warningTitle: {
      fontSize: 20, lineHeight: 26,
      fontWeight: '700',
      color: colors.warning,
      marginTop: 12,
      marginBottom: 8,
    },
    warningText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    passwordContainer: {
      marginBottom: 20,
    },
    passwordLabel: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    passwordInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16, lineHeight: 21,
      color: colors.text,
    },
    deleteButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    deleteButtonDisabled: {
      opacity: 0.6,
    },
    deleteButtonText: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.white,
    },
  });

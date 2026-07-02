import { Colors } from "@/constants/Colors";
import { authActions, authState$ } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { observer } from "@legendapp/state/react";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Screen } from '@/components/ui';

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: "Bluma nedir?",
    a: "Bluma; yazılarını paylaşabileceğin, kitapları keşfedebileceğin ve okurlar ile etkileşime geçebileceğin bir okuma-yazma topluluğudur.",
  },
  {
    q: "Hikaye nasıl yayınlanır?",
    a: "Profil > Yaz sekmesi üzerinden yeni bir hikaye oluşturabilir, bölümler ekleyip yayınlayabilirsin. Taslak olarak kaydedip sonra düzenlemen de mümkün.",
  },
  {
    q: "Hesabımı nasıl silebilirim?",
    a: "Yardım > Hesap Yönetimi bölümünden “Hesabı Sil” butonuna tıklayarak hesabını silebilirsin.",
  },
];

export default observer(function HelpScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user: currentUser } = authState$.get();

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const openMail = async () => {
    const email = "asamethon@gmail.com";
    const subject = encodeURIComponent("Bluma Destek");
    const url = `mailto:${email}?subject=${subject}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
  };

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to web browser if the app can't handle the URL
      const webUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(webUrl);
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı.');
      return;
    }

    if (currentUser.authProvider === 'email') {
      // Email kullanıcıları için şifre girişi modal'ı göster
      setShowDeleteModal(true);
    } else {
      // Google/Apple kullanıcıları için direkt onay
      Alert.alert(
        'Hesabı Sil',
        'Hesabını silmek istediğinden emin misin? Bu işlem geri alınamaz ve tüm verilerin kalıcı olarak silinecek.',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Hesabı Sil', 
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
          'Hesap Silindi',
          'Hesabın başarıyla silindi. Uygulamadan çıkış yapılıyor...',
          [{ text: 'Tamam' }]
        );
        setShowDeleteModal(false);
        // Router push'e gerek yok, layout otomatik olarak auth stack'e yönlendirecek
      } else {
        Alert.alert('Hata', result.error || 'Hesap silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteModalSubmit = () => {
    if (!deletePassword.trim()) {
      Alert.alert('Hata', 'Lütfen şifreni girin.');
      return;
    }
    performDeleteAccount(deletePassword.trim());
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
        <Text style={styles.headerTitle}>Yardım & Destek</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
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
                    <Text style={styles.rowTitle}>{item.q}</Text>
                  </View>

                  <Ionicons
                    name={openIndex === idx ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {openIndex === idx && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim</Text>
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
                <Text style={styles.rowTitle}>E-posta ile destek</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yasal</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                openLink("https://sites.google.com/view/bluma-privacy-policy")
              }
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>Gizlilik Politikası</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={() =>
                openLink(
                  "https://sites.google.com/view/bluma-terms-and-conditions"
                )
              }
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.rowTitle}>Kullanım Koşulları</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Management */}
        {currentUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hesap Yönetimi</Text>
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
                  <Text style={[styles.rowTitle, styles.dangerText]}>Hesabı Sil</Text>
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

      {/* Delete Account Modal */}
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
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hesabı Sil</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={48} color={colors.warning} />
              <Text style={styles.warningTitle}>Dikkat!</Text>
              <Text style={styles.warningText}>
                Bu işlem geri alınamaz. Hesabın ve tüm verilerin kalıcı olarak silinecek.
              </Text>
            </View>

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Şifreni Gir</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Şifreni girin"
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
                <Text style={styles.deleteButtonText}>Siliniyor...</Text>
              ) : (
                <Text style={styles.deleteButtonText}>Hesabı Kalıcı Olarak Sil</Text>
              )}
            </TouchableOpacity>
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
});

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
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      marginLeft: 8,
    },
    section: { paddingHorizontal: 16, paddingTop: 16 },
    sectionTitle: {
      fontSize: 14,
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
      fontSize: 15,
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
    // Modal styles
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
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    modalTitle: {
      fontSize: 18,
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
      fontSize: 20,
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
      fontSize: 16,
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
      fontSize: 16,
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
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
  });

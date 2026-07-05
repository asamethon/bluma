import { Button, Screen, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '@/store/hooks';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAppSelector(s => s.auth);
  const styles = createStyles(colors);

  const isEmailAccount = user?.authProvider === 'email';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldur.');
      return;
    }
    if (next.length < 6) {
      Alert.alert('Zayıf Şifre', 'Yeni şifre en az 6 karakter olmalı.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Şifreler Eşleşmiyor', 'Yeni şifre ile tekrarı aynı olmalı.');
      return;
    }
    if (next === current) {
      Alert.alert('Aynı Şifre', 'Yeni şifre mevcut şifreden farklı olmalı.');
      return;
    }

    setSaving(true);
    const res = await authActions.changePassword(current, next);
    setSaving(false);

    if (res.success) {
      Alert.alert('Başarılı', 'Şifren güncellendi.', [{ text: 'Tamam', onPress: () => router.back() }]);
    } else {
      Alert.alert('Hata', res.error || 'Şifre değiştirilemedi.');
    }
  };

  const handleResetEmail = async () => {
    if (!user?.email) return;
    const res = await authActions.resetPassword(user.email);
    if (res.success) {
      Alert.alert('E-posta Gönderildi', `${user.email} adresine şifre sıfırlama bağlantısı gönderildi.`);
    } else {
      Alert.alert('Hata', res.error || 'E-posta gönderilemedi.');
    }
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="subheading">Şifre Değiştir</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconHero, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="key" size={28} color={colors.primary} />
        </View>

        {!isEmailAccount ? (
          <View style={[styles.card, { padding: Spacing.lg }]}>
            <Text variant="bodyStrong" style={{ marginBottom: 6 }}>
              Şifre yönetimi kullanılamıyor
            </Text>
            <Text variant="body" tone="textSecondary" style={{ marginBottom: Spacing.lg }}>
              Bu hesap {user?.authProvider === 'google' ? 'Google' : 'Apple'} ile oluşturulduğundan uygulama
              içinden şifre değiştiremezsin. Şifreni sağlayıcının üzerinden yönetebilirsin.
            </Text>
          </View>
        ) : (
          <>
            <Text variant="body" tone="textSecondary" style={{ marginBottom: Spacing.lg, textAlign: 'center' }}>
              Güvenliğin için önce mevcut şifreni doğrula, ardından yeni şifreni belirle.
            </Text>

            <View style={styles.card}>
              <PasswordField
                colors={colors}
                label="Mevcut Şifre"
                value={current}
                onChangeText={setCurrent}
                show={show}
                placeholder="••••••••"
              />
              <Divider colors={colors} />
              <PasswordField
                colors={colors}
                label="Yeni Şifre"
                value={next}
                onChangeText={setNext}
                show={show}
                placeholder="En az 6 karakter"
              />
              <Divider colors={colors} />
              <PasswordField
                colors={colors}
                label="Yeni Şifre (Tekrar)"
                value={confirm}
                onChangeText={setConfirm}
                show={show}
                placeholder="Yeni şifreni tekrar gir"
              />
            </View>

            <TouchableOpacity
              style={styles.showRow}
              onPress={() => setShow(s => !s)}
              activeOpacity={0.7}
            >
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
              <Text variant="label" tone="textSecondary">{show ? 'Şifreleri gizle' : 'Şifreleri göster'}</Text>
            </TouchableOpacity>

            <Button
              label={saving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
              variant="primary"
              size="lg"
              loading={saving}
              onPress={handleSave}
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />
          </>
        )}

        <TouchableOpacity onPress={handleResetEmail} style={{ marginTop: Spacing.xl, alignItems: 'center' }}>
          <Text variant="label" tone="primary">Şifreni mi unuttun? Sıfırlama e-postası gönder</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function PasswordField({
  colors,
  label,
  value,
  onChangeText,
  show,
  placeholder,
}: {
  colors: any;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ padding: Spacing.lg }}>
      <Text variant="label" tone="textSecondary" style={{ marginBottom: 8 }}>{label}</Text>
      <View style={[fieldStyles.box, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
        <TextInput
          style={[fieldStyles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: Spacing.lg }} />;
}

const fieldStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: { flex: 1, fontFamily: Fonts.sansRegular, fontSize: 15, paddingVertical: 0 },
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
    iconHero: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    showRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
  });

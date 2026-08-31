import { Button, IconButton, Screen, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '@/store/hooks';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isEmailAccount = user?.authProvider === 'email';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      Alert.alert(t('changePassword.missingTitle'), t('changePassword.missingMessage'));
      return;
    }
    if (next.length < 6) {
      Alert.alert(t('changePassword.weakTitle'), t('changePassword.weakMessage'));
      return;
    }
    if (next !== confirm) {
      Alert.alert(t('changePassword.mismatchTitle'), t('changePassword.mismatchMessage'));
      return;
    }
    if (next === current) {
      Alert.alert(t('changePassword.sameTitle'), t('changePassword.sameMessage'));
      return;
    }

    setSaving(true);
    const res = await authActions.changePassword(current, next);
    setSaving(false);

    if (res.success) {
      Alert.alert(t('common.success'), t('changePassword.updated'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    } else {
      Alert.alert(t('common.error'), res.error || t('authErrors.changePasswordFailed'));
    }
  };

  const handleResetEmail = async () => {
    if (!user?.email) return;
    const res = await authActions.resetPassword(user.email);
    if (res.success) {
      Alert.alert(t('changePassword.emailSentTitle'), t('changePassword.emailSentMessage', { email: user.email }));
    } else {
      Alert.alert(t('common.error'), res.error || t('changePassword.emailFailed'));
    }
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" iconSize={24} glass onPress={() => router.back()} />
        <Text variant="subheading">{t('changePassword.title')}</Text>
        <View style={{ width: 40 }} />
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
              {t('changePassword.unavailableTitle')}
            </Text>
            <Text variant="body" tone="textSecondary" style={{ marginBottom: Spacing.lg }}>
              {t('changePassword.unavailableMessage', { provider: user?.authProvider === 'google' ? 'Google' : 'Apple' })}
            </Text>
          </View>
        ) : (
          <>
            <Text variant="body" tone="textSecondary" style={{ marginBottom: Spacing.lg, textAlign: 'center' }}>
              {t('changePassword.description')}
            </Text>

            <View style={styles.card}>
              <PasswordField
                colors={colors}
                label={t('changePassword.currentLabel')}
                value={current}
                onChangeText={setCurrent}
                show={show}
                placeholder="••••••••"
              />
              <Divider colors={colors} />
              <PasswordField
                colors={colors}
                label={t('changePassword.newLabel')}
                value={next}
                onChangeText={setNext}
                show={show}
                placeholder={t('auth.passwordPlaceholder')}
              />
              <Divider colors={colors} />
              <PasswordField
                colors={colors}
                label={t('changePassword.confirmLabel')}
                value={confirm}
                onChangeText={setConfirm}
                show={show}
                placeholder={t('changePassword.confirmPlaceholder')}
              />
            </View>

            <TouchableOpacity
              style={styles.showRow}
              onPress={() => setShow(s => !s)}
              activeOpacity={0.7}
            >
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
              <Text variant="label" tone="textSecondary">{show ? t('changePassword.hidePasswords') : t('changePassword.showPasswords')}</Text>
            </TouchableOpacity>

            <Button
              label={saving ? t('onboarding.savingProgress') : t('changePassword.updateButton')}
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
          <Text variant="label" tone="primary">{t('changePassword.forgotLink')}</Text>
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
  input: { flex: 1, fontFamily: Fonts.sansRegular, fontSize: 15, lineHeight: 20, paddingVertical: 0 },
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

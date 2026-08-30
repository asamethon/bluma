import { Button, Screen, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { useEmailVerification } from '@/features/auth/hooks/useEmailVerification';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const v = useEmailVerification();

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="subheading">{t('emailVerify.screenTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Ionicons
            name={v.verified ? 'checkmark-circle' : 'mail-unread-outline'}
            size={32}
            color={v.verified ? colors.success : colors.primary}
          />
          <Text variant="body" style={styles.center}>
            {v.verified ? t('emailVerify.verifiedBody') : t('emailVerify.pendingBody', { email: v.email })}
          </Text>
        </View>

        {!v.verified && (
          <>
            <Button label={t('emailVerify.checkNow')} onPress={v.check} disabled={v.busy} />
            <Button
              label={t('emailVerify.resend')}
              variant="secondary"
              onPress={v.resend}
              disabled={v.busy}
            />

            <Text variant="subheading" style={styles.sectionTitle}>
              {t('emailVerify.wrongAddressTitle')}
            </Text>
            <Text variant="caption" tone="textSecondary">
              {t('emailVerify.wrongAddressBody')}
            </Text>

            <TextInput
              style={styles.input}
              value={v.newEmail}
              onChangeText={v.setNewEmail}
              placeholder={t('emailVerify.newEmailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            {v.needsPassword && (
              <TextInput
                style={styles.input}
                value={v.password}
                onChangeText={v.setPassword}
                placeholder={t('emailVerify.passwordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
            <Button
              label={t('emailVerify.changeSubmit')}
              onPress={v.submitChange}
              disabled={v.busy || !v.newEmail.trim()}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    body: { padding: Spacing.lg, gap: Spacing.md },
    card: {
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    center: { textAlign: 'center' },
    sectionTitle: { marginTop: Spacing.lg },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: colors.text,
      backgroundColor: colors.surface,
    },
  });

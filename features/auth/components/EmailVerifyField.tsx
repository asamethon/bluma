import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { useEmailVerification } from '../hooks/useEmailVerification';

/**
 * Hesap ekranındaki e-posta alanı.
 *
 * Doğrulanmışsa adres KİLİTLİ — değiştirilemez. Doğrulanmamışsa düzenlenebilir
 * ve yanında tek bir "Doğrula" düğmesi var: adres değiştirildiyse bağlantı
 * yeni adrese gider, değiştirilmediyse mevcut adrese yeniden gönderilir.
 */
export function EmailVerifyField() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const v = useEmailVerification();

  if (v.verified) {
    return (
      <View>
        <Text variant="label" tone="textSecondary" style={styles.label}>
          {t('auth.emailLabel')}
        </Text>
        <View style={[styles.box, styles.locked]}>
          <Ionicons name="mail-outline" size={18} color={colors.textLight} />
          <Text variant="body" tone="textSecondary" style={styles.value} numberOfLines={1}>
            {v.currentEmail || '—'}
          </Text>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        </View>
        <Text variant="caption" tone="textLight" style={styles.hint}>
          {t('editProfile.emailReadonly')}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text variant="label" tone="textSecondary" style={styles.label}>
        {t('auth.emailLabel')}
      </Text>

      <View style={styles.row}>
        <View style={[styles.box, styles.editable]}>
          <Ionicons name="mail-outline" size={18} color={colors.textLight} />
          <TextInput
            style={styles.input}
            value={v.draft}
            onChangeText={v.setDraft}
            placeholder={t('emailVerify.newEmailPlaceholder')}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
          />
        </View>
        <Button
          label={t('emailVerify.verifyAction')}
          size="sm"
          onPress={v.submit}
          disabled={v.busy || !v.draft.trim()}
        />
      </View>

      {v.needsPassword && (
        <View style={[styles.box, styles.editable, styles.passwordBox]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} />
          <TextInput
            style={styles.input}
            value={v.password}
            onChangeText={v.setPassword}
            placeholder={t('emailVerify.passwordPlaceholder')}
            placeholderTextColor={colors.textLight}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
      )}

      <Text variant="caption" tone="textLight" style={styles.hint}>
        {v.sentTo
          ? t('emailVerify.sentBody', { email: v.sentTo })
          : t('emailVerify.fieldHint')}
      </Text>

      {v.sentTo && (
        <Button
          label={t('emailVerify.checkNow')}
          variant="ghost"
          size="sm"
          onPress={v.check}
          disabled={v.busy}
          style={styles.checkButton}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    label: { marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minHeight: 46,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderRadius: Radius.md,
      borderColor: colors.border,
    },
    locked: { backgroundColor: colors.surfaceVariant },
    editable: { backgroundColor: colors.surface },
    passwordBox: { marginTop: Spacing.sm },
    input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
    value: { flex: 1 },
    hint: { marginTop: 6 },
    checkButton: { alignSelf: 'flex-start', marginTop: 4 },
  });

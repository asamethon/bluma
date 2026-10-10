import { PageHeader, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useChangePassword } from '@/features/profile/hooks/useChangePassword';
import { createChangePasswordStyles } from '@/features/profile/styles/changePasswordStyles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { ChangePasswordForm } from './ChangePasswordForm';

export function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const form = useChangePassword();
  const styles = useMemo(() => createChangePasswordStyles(colors), [colors]);
  return (
    <Screen style={styles.container} edges={['top']}>
      <PageHeader title={t('changePassword.title')} onBack={router.back} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.iconHero, { backgroundColor: colors.primarySoft }]}><Ionicons name="key" size={28} color={colors.primary} /></View>
        {!form.isEmailAccount ? (
          <View style={[styles.card, styles.providerCard]}>
            <Text variant="bodyStrong" style={styles.providerTitle}>{t('changePassword.unavailableTitle')}</Text>
            <Text variant="body" tone="textSecondary" style={styles.providerMessage}>
              {t('changePassword.unavailableMessage', { provider: form.provider === 'google' ? 'Google' : 'Apple' })}
            </Text>
          </View>
        ) : (
          <ChangePasswordForm
            confirm={form.confirm}
            current={form.current}
            next={form.next}
            saving={form.saving}
            styles={styles}
            visible={form.visible}
            onConfirm={form.setConfirm}
            onCurrent={form.setCurrent}
            onNext={form.setNext}
            onSave={form.save}
            onToggleVisible={form.toggleVisible}
          />
        )}
        <TouchableOpacity onPress={form.sendReset} style={styles.forgot}>
          <Text variant="label" tone="primary">{t('changePassword.forgotLink')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

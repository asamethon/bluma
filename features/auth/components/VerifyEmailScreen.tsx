import { createVerifyEmailStyles as createStyles } from '@/features/auth/styles/verifyEmailStyles';
import { IconButton, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { EmailVerifyField } from '@/features/auth/components/EmailVerifyField';
import { GRACE_DAYS } from '@/features/auth/services/emailGrace';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-back" iconSize={24} onPress={() => router.back()} />
        <Text variant="subheading">{t('emailVerify.screenTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Ionicons name="mail-unread-outline" size={32} color={colors.primary} />
          <Text variant="body" style={styles.center}>
            {t('emailVerify.explainer', { days: GRACE_DAYS })}
          </Text>
        </View>

        <EmailVerifyField />
      </ScrollView>
    </Screen>
  );
}

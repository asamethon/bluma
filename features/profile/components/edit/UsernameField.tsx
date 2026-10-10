import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { UsernameStatus } from '@/features/profile/hooks/useEditProfileForm';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { editProfileFieldStyles as styles } from '../../styles/editProfileFieldStyles';

type Props = {
  value: string;
  originalUsername?: string;
  status: UsernameStatus;
  onChange: (value: string) => void;
};

export function UsernameField({ value, originalUsername, status, onChange }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const statusMeta = status === 'checking'
    ? { icon: 'time-outline' as const, color: colors.textSecondary, text: t('onboarding.checking') }
    : status === 'available'
      ? { icon: 'checkmark-circle' as const, color: colors.success, text: t('editProfile.available') }
      : status === 'taken'
        ? { icon: 'close-circle' as const, color: colors.error, text: t('editProfile.taken') }
        : null;
  const showStatus = value.length >= 3 && value !== originalUsername && statusMeta;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="textSecondary">
          {t('editProfile.usernameLabel')} <Text variant="label" style={{ color: colors.bloom }}>*</Text>
        </Text>
        {showStatus && (
          <View style={styles.status}>
            <Ionicons name={statusMeta.icon} size={14} color={statusMeta.color} />
            <Text variant="caption" style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.text}</Text>
          </View>
        )}
      </View>
      <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
        <Text variant="body" tone="textLight" style={styles.atSign}>@</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          placeholder={t('onboarding.usernamePlaceholder')}
          placeholderTextColor={colors.textLight}
          maxLength={30}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Text variant="caption" tone="textLight" style={styles.hint}>{t('editProfile.usernameHint')}</Text>
    </View>
  );
}

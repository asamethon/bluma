import { Button, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { ChangePasswordStyles } from '@/features/profile/styles/changePasswordStyles';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { PasswordField } from './PasswordField';

type Props = {
  confirm: string;
  current: string;
  next: string;
  saving: boolean;
  styles: ChangePasswordStyles;
  visible: boolean;
  onConfirm: (value: string) => void;
  onCurrent: (value: string) => void;
  onNext: (value: string) => void;
  onSave: () => void;
  onToggleVisible: () => void;
};

export const ChangePasswordForm = memo(function ChangePasswordForm(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Text variant="body" tone="textSecondary" style={props.styles.description}>{t('changePassword.description')}</Text>
      <View style={props.styles.card}>
        <PasswordField label={t('changePassword.currentLabel')} value={props.current} onChange={props.onCurrent} visible={props.visible} placeholder="••••••••" styles={props.styles} />
        <View style={props.styles.divider} />
        <PasswordField label={t('changePassword.newLabel')} value={props.next} onChange={props.onNext} visible={props.visible} placeholder={t('auth.passwordPlaceholder')} styles={props.styles} />
        <View style={props.styles.divider} />
        <PasswordField label={t('changePassword.confirmLabel')} value={props.confirm} onChange={props.onConfirm} visible={props.visible} placeholder={t('changePassword.confirmPlaceholder')} styles={props.styles} />
      </View>
      <TouchableOpacity style={props.styles.showRow} onPress={props.onToggleVisible} activeOpacity={0.7}>
        <Ionicons name={props.visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
        <Text variant="label" tone="textSecondary">
          {t(props.visible ? 'changePassword.hidePasswords' : 'changePassword.showPasswords')}
        </Text>
      </TouchableOpacity>
      <Button
        label={t(props.saving ? 'onboarding.savingProgress' : 'changePassword.updateButton')}
        variant="primary"
        size="lg"
        loading={props.saving}
        onPress={props.onSave}
        fullWidth
        style={props.styles.saveButton}
      />
    </>
  );
});

import { EmailVerifyField } from '@/features/auth/components/EmailVerifyField';
import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { EditProfileField as FieldName, UsernameStatus } from '@/features/profile/hooks/useEditProfileForm';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { createEditProfileStyles } from '../../styles/editProfileStyles';
import { editProfileFieldStyles as fieldStyles } from '../../styles/editProfileFieldStyles';
import { EditProfileDivider, EditProfileField } from './EditProfileField';
import { UsernameField } from './UsernameField';

type Form = Record<FieldName, string>;
type FormProps = { form: Form; update: (field: FieldName, value: string) => void };

export function EditProfileCoreSection(props: FormProps & { user: User; usernameStatus: UsernameStatus }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createEditProfileStyles(colors);
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="textLight" style={styles.sectionLabel}>{t('editProfile.profileSection')}</Text>
      <View style={styles.card}>
        <EditProfileField
          label={t('auth.fullNameLabel')}
          required
          value={props.form.displayName}
          onChangeText={value => props.update('displayName', value)}
          placeholder={t('editProfile.namePlaceholder')}
          maxLength={50}
          counter={`${props.form.displayName.length}/50`}
        />
        <EditProfileDivider />
        <UsernameField
          value={props.form.username}
          originalUsername={props.user.username}
          status={props.usernameStatus}
          onChange={value => props.update('username', value)}
        />
        <EditProfileDivider />
        <View style={fieldStyles.field}><EmailVerifyField /></View>
      </View>
    </View>
  );
}

export function EditProfileAboutSection({ form, update }: FormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createEditProfileStyles(colors);
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="textLight" style={styles.sectionLabel}>{t('editProfile.aboutSection')}</Text>
      <View style={styles.card}>
        <View style={fieldStyles.field}>
          <View style={fieldStyles.labelRow}>
            <Text variant="label" tone="textSecondary">{t('editProfile.bioLabel')}</Text>
            <Text variant="caption" tone="textLight">{form.bio.length}/160</Text>
          </View>
          <TextInput
            style={[fieldStyles.bioInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
            value={form.bio}
            onChangeText={value => update('bio', value)}
            placeholder={t('editProfile.bioPlaceholder')}
            placeholderTextColor={colors.textLight}
            multiline maxLength={160} textAlignVertical="top"
          />
        </View>
        <EditProfileDivider />
        <EditProfileField
          label={t('editProfile.websiteLabel')}
          value={form.website}
          onChangeText={value => update('website', value)}
          placeholder="https://siten.com"
          keyboardType="url"
          autoCapitalize="none"
          icon="globe-outline"
        />
        <EditProfileDivider />
        <EditProfileField
          label={t('editProfile.locationLabel')}
          value={form.location}
          onChangeText={value => update('location', value)}
          placeholder={t('editProfile.locationPlaceholder')}
          maxLength={50}
          icon="location-outline"
        />
      </View>
    </View>
  );
}

export function EditProfileAccountSection() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = createEditProfileStyles(colors);
  const settings = [
    { icon: 'key-outline', label: t('changePassword.title'), caption: t('editProfile.passwordCaption'), route: '/profile/change-password' },
    { icon: 'lock-closed-outline', label: t('privacy.title'), caption: t('editProfile.privacyCaption'), route: '/profile/privacy' },
    { icon: 'notifications-outline', label: t('notifications.title'), caption: t('editProfile.notificationsCaption'), route: '/profile/notification-settings' },
  ] as const;
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="textLight" style={styles.sectionLabel}>{t('editProfile.accountSection')}</Text>
      <View style={styles.card}>
        {settings.map((item, index) => (
          <Fragment key={item.route}>
            {index > 0 && <EditProfileDivider />}
            <TouchableOpacity style={styles.settingRow} onPress={() => router.push(item.route)} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={item.icon} size={19} color={colors.primary} />
              </View>
              <View style={styles.settingCopy}>
                <Text variant="bodyStrong">{item.label}</Text>
                <Text variant="caption" tone="textLight">{item.caption}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

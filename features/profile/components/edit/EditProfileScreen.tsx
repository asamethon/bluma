import { Button, PageHeader, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useEditProfileForm } from '@/features/profile/hooks/useEditProfileForm';
import { useAppSelector } from '@/store/hooks';
import type { User } from '@/types';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { createEditProfileStyles } from '../../styles/editProfileStyles';
import { EditProfilePhoto } from './EditProfilePhoto';
import { EditProfileAboutSection, EditProfileAccountSection, EditProfileCoreSection } from './EditProfileSections';

function EditProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const form = useEditProfileForm(user);
  const styles = useMemo(() => createEditProfileStyles(colors), [colors]);

  return (
    <Screen style={styles.container} edges={['top']}>
      <PageHeader title={t('profileScreen.editProfile')} onBack={router.back} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <EditProfilePhoto
          image={form.avatar.image}
          coverImage={form.cover.image}
          name={form.form.displayName || user.displayName}
          onAvatarPress={form.avatar.showOptions}
          onCoverPress={form.cover.showOptions}
        />
        <EditProfileCoreSection
          user={user}
          form={form.form}
          usernameStatus={form.usernameStatus}
          update={form.update}
        />
        <EditProfileAboutSection form={form.form} update={form.update} />
        <EditProfileAccountSection />
      </ScrollView>
      <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          label={form.saving ? t('onboarding.savingProgress') : t('editProfile.saveChanges')}
          variant="primary"
          size="lg"
          icon={form.saving ? undefined : 'checkmark'}
          loading={form.saving}
          onPress={form.save}
          fullWidth
        />
      </View>
    </Screen>
  );
}

export function EditProfileScreen() {
  const { colors } = useTheme();
  const user = useAppSelector(state => state.auth.user);
  const styles = useMemo(() => createEditProfileStyles(colors), [colors]);
  if (user) return <EditProfileForm key={user.id} user={user} />;

  return (
    <Screen style={styles.container}>
      <View style={styles.centerFill}>
        <ActivityIndicator color={colors.primary} />
        <Text variant="body" tone="textSecondary" style={styles.loadingText}>Kullanıcı bilgileri yükleniyor...</Text>
      </View>
    </Screen>
  );
}

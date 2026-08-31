import { Avatar, Button, IconButton, Screen, Text } from '@/components/ui';
import { EmailVerifyField } from '@/features/auth/components/EmailVerifyField';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { imageUploadService } from '@/services/imageUploadService';
import { authActions, User } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { logger } from '@/utils/logger';

type UsernameStatus = 'checking' | 'available' | 'taken' | null;

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user);

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    location: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || '',
      });
      setProfileImage(user.profileImage || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(t('avatarPicker.permissionRequired'), t('avatarPicker.galleryPermission'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('avatarPicker.goToSettings'), onPress: () => Linking.openSettings() },
          ]);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setProfileImage(result.assets[0].uri);
    } catch (error) {
      logger.error('Image picker error:', error);
      Alert.alert(t('common.error'), t('avatarPicker.pickError'));
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(t('avatarPicker.permissionRequired'), t('avatarPicker.cameraPermission'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('avatarPicker.goToSettings'), onPress: () => Linking.openSettings() },
          ]);
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setProfileImage(result.assets[0].uri);
    } catch (error) {
      logger.error('Camera error:', error);
      Alert.alert(t('common.error'), t('avatarPicker.captureError'));
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(t('avatarPicker.title'), t('avatarPicker.subtitle'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('avatarPicker.takePhoto'), onPress: takePhoto },
      { text: t('avatarPicker.pickFromGallery'), onPress: pickImage },
      ...(profileImage
        ? [{ text: t('avatarPicker.removePhoto'), style: 'destructive' as const, onPress: () => setProfileImage(null) }]
        : []),
    ]);
  };

  const updateUsername = async (username: string) => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: cleanUsername }));

    if (cleanUsername === user?.username) {
      setUsernameStatus(null);
      return;
    }
    if (cleanUsername.length >= 3) {
      setUsernameStatus('checking');
      try {
        const isAvailable = await authActions.checkUsernameAvailability(cleanUsername);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch {
        setUsernameStatus('taken');
      }
    } else {
      setUsernameStatus(null);
    }
  };

  const updateField = (field: string, value: string) => {
    if (field === 'username') updateUsername(value);
    else setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.displayName.trim() || !formData.username.trim()) {
      Alert.alert(t('common.error'), t('editProfile.nameUsernameRequired'));
      return;
    }
    if (formData.username !== user?.username && usernameStatus !== 'available') {
      Alert.alert(t('common.error'), t('editProfile.pickAvailableUsername'));
      return;
    }

    setIsLoading(true);
    try {
      let finalProfileImage = user?.profileImage;
      if (profileImage && profileImage !== user?.profileImage) {
        if (user?.profileImage) await imageUploadService.deleteProfileImage(user.profileImage);
        finalProfileImage = await imageUploadService.uploadProfileImage(user!.id, profileImage);
      } else if (!profileImage && user?.profileImage) {
        await imageUploadService.deleteProfileImage(user.profileImage);
        finalProfileImage = undefined;
      }

      const updatedUser: User = {
        ...user!,
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        website: formData.website.trim(),
        location: formData.location.trim(),
        profileImage: finalProfileImage,
      };

      await authActions.updateUserProfile(updatedUser);
      Alert.alert(t('common.success'), t('editProfile.updated'), [
        { text: t('common.ok'), onPress: () => router.push('/(tabs)/profile') },
      ]);
    } catch (error) {
      logger.error('Profile update error:', error);
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('account.profileUpdateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Screen style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="body" tone="textSecondary" style={{ marginTop: 12 }}>
            Kullanıcı bilgileri yükleniyor...
          </Text>
        </View>
      </Screen>
    );
  }

  const accountSettings: { icon: keyof typeof Ionicons.glyphMap; label: string; caption: string; route: string }[] = [
    { icon: 'key-outline', label: t('changePassword.title'), caption: t('editProfile.passwordCaption'), route: '/profile/change-password' },
    { icon: 'lock-closed-outline', label: t('privacy.title'), caption: t('editProfile.privacyCaption'), route: '/profile/privacy' },
    { icon: 'notifications-outline', label: t('notifications.title'), caption: t('editProfile.notificationsCaption'), route: '/profile/notification-settings' },
  ];

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" iconSize={24} glass onPress={() => router.back()} />
        <Text variant="subheading">{t('profileScreen.editProfile')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoSection}>
          <TouchableOpacity activeOpacity={0.85} onPress={showImagePickerOptions} style={styles.avatarWrap}>
            <Avatar uri={profileImage || undefined} name={formData.displayName || user.displayName} size={104} ring />
            <View style={[styles.editBadge, shadows.sm]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={showImagePickerOptions}>
            <Text variant="label" tone="primary" style={{ marginTop: 12 }}>
              {profileImage ? t('editProfile.changePhoto') : t('profileScreen.addPhoto')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text variant="overline" tone="textLight" style={styles.sectionLabel}>
            {t('editProfile.profileSection')}
          </Text>
          <View style={styles.card}>
            <Field
              colors={colors}
              label={t('auth.fullNameLabel')}
              required
              value={formData.displayName}
              onChangeText={v => updateField('displayName', v)}
              placeholder={t('editProfile.namePlaceholder')}
              maxLength={50}
              counter={`${formData.displayName.length}/50`}
            />
            <Divider colors={colors} />

            <View style={fieldStyles.field}>
              <View style={fieldStyles.fieldLabelRow}>
                <Text variant="label" tone="textSecondary">
                  {t('editProfile.usernameLabel')} <Text variant="label" style={{ color: colors.bloom }}>*</Text>
                </Text>
                <UsernameHint status={usernameStatus} username={formData.username} colors={colors} userUsername={user.username} />
              </View>
              <View style={[fieldStyles.inputBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                <Text variant="body" tone="textLight" style={{ marginRight: 2 }}>@</Text>
                <TextInput
                  style={[fieldStyles.input, { color: colors.text }]}
                  value={formData.username}
                  onChangeText={v => updateField('username', v)}
                  placeholder={t('onboarding.usernamePlaceholder')}
                  placeholderTextColor={colors.textLight}
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text variant="caption" tone="textLight" style={{ marginTop: 6 }}>
                {t('editProfile.usernameHint')}
              </Text>
            </View>
            <Divider colors={colors} />

            <View style={fieldStyles.field}>
              {/* Doğrulanmamışsa düzenlenebilir + "Doğrula"; doğrulanmışsa kilitli. */}
              <EmailVerifyField />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="overline" tone="textLight" style={styles.sectionLabel}>
            {t('editProfile.aboutSection')}
          </Text>
          <View style={styles.card}>
            <View style={fieldStyles.field}>
              <View style={fieldStyles.fieldLabelRow}>
                <Text variant="label" tone="textSecondary">{t('editProfile.bioLabel')}</Text>
                <Text variant="caption" tone="textLight">{formData.bio.length}/160</Text>
              </View>
              <TextInput
                style={[fieldStyles.bioInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                value={formData.bio}
                onChangeText={v => updateField('bio', v)}
                placeholder={t('editProfile.bioPlaceholder')}
                placeholderTextColor={colors.textLight}
                multiline
                maxLength={160}
                textAlignVertical="top"
              />
            </View>
            <Divider colors={colors} />
            <Field
              colors={colors}
              label={t('editProfile.websiteLabel')}
              value={formData.website}
              onChangeText={v => updateField('website', v)}
              placeholder="https://siten.com"
              keyboardType="url"
              autoCapitalize="none"
              icon="globe-outline"
            />
            <Divider colors={colors} />
            <Field
              colors={colors}
              label={t('editProfile.locationLabel')}
              value={formData.location}
              onChangeText={v => updateField('location', v)}
              placeholder={t('editProfile.locationPlaceholder')}
              maxLength={50}
              icon="location-outline"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="overline" tone="textLight" style={styles.sectionLabel}>
            {t('editProfile.accountSection')}
          </Text>
          <View style={styles.card}>
            {accountSettings.map((item, i) => (
              <React.Fragment key={item.route}>
                {i > 0 && <Divider colors={colors} />}
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.settingIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={item.icon} size={19} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{item.label}</Text>
                    <Text variant="caption" tone="textLight">{item.caption}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          label={isLoading ? t('onboarding.savingProgress') : t('editProfile.saveChanges')}
          variant="primary"
          size="lg"
          icon={isLoading ? undefined : 'checkmark'}
          loading={isLoading}
          onPress={handleSave}
          fullWidth
        />
      </View>
    </Screen>
  );
}

function Field({
  colors,
  label,
  required,
  value,
  onChangeText,
  placeholder,
  maxLength,
  counter,
  keyboardType,
  autoCapitalize,
  icon,
}: {
  colors: any;
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  counter?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={fieldStyles.field}>
      <View style={fieldStyles.fieldLabelRow}>
        <Text variant="label" tone="textSecondary">
          {label}
          {required ? <Text variant="label" style={{ color: colors.bloom }}> *</Text> : null}
        </Text>
        {counter ? <Text variant="caption" tone="textLight">{counter}</Text> : null}
      </View>
      <View style={[fieldStyles.inputBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textLight} style={{ marginRight: 8 }} />}
        <TextInput
          style={[fieldStyles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

function UsernameHint({
  status,
  username,
  colors,
  userUsername,
}: {
  status: UsernameStatus;
  username: string;
  colors: any;
  userUsername?: string;
}) {
  if (username.length < 3 || username === userUsername || !status) return null;
  const map = {
    checking: { icon: 'time-outline' as const, color: colors.textSecondary, text: i18n.t('onboarding.checking') },
    available: { icon: 'checkmark-circle' as const, color: colors.success, text: i18n.t('editProfile.available') },
    taken: { icon: 'close-circle' as const, color: colors.error, text: i18n.t('editProfile.taken') },
  };
  const m = map[status];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={m.icon} size={14} color={m.color} />
      <Text variant="caption" style={{ color: m.color, fontWeight: '600' }}>{m.text}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: Spacing.lg }} />;
}

const fieldStyles = StyleSheet.create({
  field: { padding: Spacing.lg },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputDisabled: { opacity: 0.75 },
  input: {
    flex: 1,
    fontFamily: Fonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 92,
    fontFamily: Fonts.serifRegular,
    fontSize: 16,
    lineHeight: 24,
  },
});

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    photoSection: {
      alignItems: 'center',
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xl,
    },
    avatarWrap: { position: 'relative' },
    editBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    section: { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.xl },
    sectionLabel: { marginBottom: Spacing.sm, marginLeft: Spacing.xs },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
    },
    settingIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  });

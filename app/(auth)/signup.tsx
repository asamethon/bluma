import { Button, IconButton, Screen, Text } from '@/components/ui';
import { suggestEmailFix } from '@/features/auth/utils/emailTypos';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/legal';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function LabeledInput({
  label,
  icon,
  value,
  onChangeText,
  right,
  ...props
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  right?: React.ReactNode;
  [k: string]: any;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? colors.primary : colors.border;
  const iconColor   = focused ? colors.primary : colors.textLight;
  const labelColor  = focused ? colors.primary : colors.textSecondary;

  return (
    <View>
      <Text style={[s.fieldLabel, { color: labelColor, fontFamily: Fonts.sans }]}>{label}</Text>
      <View style={[s.inputBox, { borderColor, backgroundColor: colors.surface }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <TextInput
          style={[s.textInput, { color: colors.text, fontFamily: Fonts.sans }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textLight}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

function pwStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[0-9]/.test(pw) && /[a-z]/i.test(pw)) s++;
  if (/[^a-z0-9]/i.test(pw)) s++;
  return Math.min(s, 4);
}

function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[a-z]/i.test(pw) && /[0-9]/.test(pw);
}

const STR_LABELS = ['', 'auth.pwWeak', 'auth.pwMedium', 'auth.pwGood', 'auth.pwStrong'];
const STR_COLORS = ['transparent', '#E5604F', '#E6B95C', '#46B98A', '#2FA98A'];

export default function SignUpScreen() {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const isLoading = useAppSelector(s => s.auth.isLoading);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const hasCompletedOnboarding = useAppSelector(s => s.auth.hasCompletedOnboarding);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);

  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

  const updateField = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const validateForm = () => {
    if (!formData.name.trim()) { Alert.alert(t('common.error'), t('auth.enterName')); return false; }
    if (!formData.email.trim() || !formData.email.includes('@')) { Alert.alert(t('common.error'), t('auth.enterValidEmail')); return false; }
    if (!isStrongPassword(formData.password)) {
      Alert.alert(t('common.error'), t('auth.passwordRequirements'));
      return false;
    }
    if (!agree) { Alert.alert(t('common.error'), t('auth.mustAcceptTerms')); return false; }
    return true;
  };

  // Yazım hatası olan adrese kaydolan kullanıcı doğrulama postasını hiç
  // alamaz; hesap açılmadan ÖNCE soruyoruz.
  const confirmEmailTypo = () => {
    const suggestion = suggestEmailFix(formData.email);
    if (!suggestion) return Promise.resolve(true);
    return new Promise<boolean>(resolve => {
      Alert.alert(t('emailVerify.typoTitle'), t('emailVerify.typoBody', { suggestion }), [
        { text: t('emailVerify.typoKeep'), style: 'cancel', onPress: () => resolve(true) },
        {
          text: t('emailVerify.typoUse'),
          onPress: () => { updateField('email', suggestion); resolve(false); },
        },
      ]);
    });
  };

  const handleEmailSignUp = async () => {
    if (!validateForm()) return;
    if (!(await confirmEmailTypo())) return;
    try {
      const result = await authActions.signUpWithEmail(formData.email, formData.password, formData.name);
      if (!result.success) Alert.alert(t('common.error'), result.error || t('authErrors.signUpFailed'));
    } catch {
      Alert.alert(t('common.error'), t('authErrors.signUpFailed'));
    }
  };

  const handleGoogleSignUp = async () => {
    if (isLoading) return;
    const result = await authActions.signInWithGoogle();
    if (!result.success) Alert.alert(t('common.error'), result.error || t('authErrors.googleSignInFailed'));
  };

  const handleAppleSignUp = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const result = await authActions.signInWithApple(credential);
      if (!result.success) Alert.alert(t('common.error'), result.error || t('authErrors.appleSignInFailed'));
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') Alert.alert(t('common.error'), t('authErrors.appleSignInFailed'));
    }
  };


  const pwStr = pwStrength(formData.password);
  const showApple = Platform.OS === 'ios';
  const ready = !!formData.name.trim() && /\S+@\S+/.test(formData.email) && isStrongPassword(formData.password) && agree;

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[s.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconButton icon="chevron-back" variant="sunk" size={42} iconSize={22} style={s.backBtn} glass onPress={() => {
              if (router.canGoBack()) router.back();
              else router.navigate('/(auth)/walkthrough');
            }} />

          <Text style={[s.heading, { fontFamily: fonts.serif, color: colors.text }]}>
            {t('auth.createAccountTitle')}
          </Text>
          <Text variant="body" tone="textSecondary" style={{ marginTop: 6, lineHeight: 22 }}>
            {t('auth.createAccountSub')}
          </Text>

          <View style={s.form}>
            <LabeledInput
              label={t('auth.fullNameLabel')}
              icon="person-outline"
              value={formData.name}
              onChangeText={v => updateField('name', v)}
              placeholder={t('auth.fullNamePlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <LabeledInput
              label={t('auth.emailLabel')}
              icon="mail-outline"
              value={formData.email}
              onChangeText={v => updateField('email', v)}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View>
              <LabeledInput
                label={t('auth.passwordLabel')}
                icon="lock-closed-outline"
                value={formData.password}
                onChangeText={v => updateField('password', v)}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                right={
                  <Pressable onPress={() => setShowPassword(v => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.textLight}
                    />
                  </Pressable>
                }
              />
              {formData.password.length > 0 && (
                <View style={s.strengthRow}>
                  <View style={s.strengthBars}>
                    {[1, 2, 3, 4].map(i => (
                      <View
                        key={i}
                        style={[s.strengthBar, { backgroundColor: i <= pwStr ? STR_COLORS[pwStr] : colors.border }]}
                      />
                    ))}
                  </View>
                  <Text variant="caption" style={{ fontWeight: '700', color: STR_COLORS[pwStr] }}>
                    {pwStr > 0 ? t(STR_LABELS[pwStr]) : ''}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={s.termsRow} onPress={() => setAgree(a => !a)} activeOpacity={0.7}>
              <View style={[
                s.checkbox,
                agree
                  ? { backgroundColor: colors.primary, borderWidth: 0 }
                  : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
              ]}>
                {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text variant="caption" tone="textSecondary" style={s.termsText}>
                <Text
                  variant="caption"
                  style={{ fontWeight: '700', color: colors.text }}
                  onPress={openTermsOfService}
                >
                  {t('legal.terms')}
                </Text>
                {' '}{t('auth.termsAnd')}{' '}
                <Text
                  variant="caption"
                  style={{ fontWeight: '700', color: colors.text }}
                  onPress={openPrivacyPolicy}
                >
                  {t('legal.privacyPolicy')}
                </Text>
                {t('auth.termsAccept')}
              </Text>
            </TouchableOpacity>

            <Button
              label={isLoading ? t('auth.creatingAccount') : t('common.continue')}
              variant="primary"
              size="lg"
              iconRight="arrow-forward"
              onPress={handleEmailSignUp}
              disabled={!ready || isLoading}
              style={{ marginTop: 4 }}
            />

            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
              <Text variant="caption" tone="textLight" style={s.dividerLabel}>{t('auth.or')}</Text>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={s.socialRow}>
              {showApple && (
                <TouchableOpacity
                  style={[s.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handleAppleSignUp}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-apple" size={20} color={colors.text} />
                  <Text variant="label" style={{ fontWeight: '700', color: colors.text }}>Apple</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  s.socialBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  !showApple && { flex: undefined, width: '100%' },
                ]}
                onPress={handleGoogleSignUp}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={20} color={colors.text} />
                <Text variant="label" style={{ fontWeight: '700', color: colors.text }}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }} />
          <View style={s.footer}>
            <Text variant="body" tone="textSecondary">{t('guest.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text variant="body" tone="primary" style={{ fontWeight: '700' }}>{t('guest.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 16,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginLeft: -6,
  },
  heading: {
    fontSize: 30, fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 20, lineHeight: 40,
  },
  form: { marginTop: 26, gap: 16 },
  fieldLabel: {
    fontSize: 12, lineHeight: 16,
    fontWeight: '600',
    marginBottom: 7,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Radius.md, paddingHorizontal: 16, height: 56,
    borderWidth: 1.5,
  },
  textInput: { flex: 1, fontSize: 16, lineHeight: 22, paddingVertical: 0 },
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, paddingHorizontal: 4,
  },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  termsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 2,
  },
  checkbox: {
    width: 22, height: 22, marginTop: 1, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  termsText: { flex: 1, lineHeight: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontWeight: '600', paddingHorizontal: 14 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  footer: {
    paddingVertical: 24,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
});

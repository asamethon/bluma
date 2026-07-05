import {
  Screen, Button, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect, router, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/* ── Labeled input — label above, border turns violet on focus ─────────── */
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

// Minimum kabul edilebilir şifre: ≥8 karakter, en az bir harf ve bir rakam.
function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[a-z]/i.test(pw) && /[0-9]/.test(pw);
}

const STR_LABELS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];
const STR_COLORS = ['transparent', '#E5604F', '#E6B95C', '#46B98A', '#2FA98A'];

export default function SignUpScreen() {
  const { colors, fonts } = useTheme();
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAppSelector(s => s.auth);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);

  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

  const updateField = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const validateForm = () => {
    if (!formData.name.trim()) { Alert.alert('Hata', 'Lütfen adınızı girin.'); return false; }
    if (!formData.email.trim() || !formData.email.includes('@')) { Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.'); return false; }
    if (!isStrongPassword(formData.password)) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermelidir.');
      return false;
    }
    if (!agree) { Alert.alert('Hata', 'Devam etmek için kullanım koşullarını kabul etmelisiniz.'); return false; }
    return true;
  };

  const handleEmailSignUp = async () => {
    if (!validateForm()) return;
    try {
      const result = await authActions.signUpWithEmail(formData.email, formData.password, formData.name);
      if (!result.success) Alert.alert('Hata', result.error || 'Kayıt olurken bir hata oluştu.');
    } catch {
      Alert.alert('Hata', 'Kayıt olurken bir hata oluştu.');
    }
  };

  const handleGoogleSignUp = async () => {
    if (isLoading) return;
    const result = await authActions.signInWithGoogle();
    if (!result.success) Alert.alert('Hata', result.error || 'Google ile kayıt olurken bir hata oluştu.');
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
      if (!result.success) Alert.alert('Hata', result.error || 'Apple ile kayıt olurken bir hata oluştu.');
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') Alert.alert('Hata', 'Apple ile kayıt olurken bir hata oluştu.');
    }
  };

  const openLink = (url: string) => Linking.openURL(url).catch(() => {});

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
          {/* Back button — filled surface-sunk, no border */}
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.navigate('/(auth)/walkthrough');
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={[s.heading, { fontFamily: fonts.serif, color: colors.text }]}>
            Hesabını oluştur
          </Text>
          <Text variant="body" tone="textSecondary" style={{ marginTop: 6, lineHeight: 22 }}>
            Birkaç saniye sürer. İlk hikâyene birlikte başlayalım.
          </Text>

          {/* Form */}
          <View style={s.form}>
            <LabeledInput
              label="Ad Soyad"
              icon="person-outline"
              value={formData.name}
              onChangeText={v => updateField('name', v)}
              placeholder="Adın ve soyadın"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <LabeledInput
              label="E-posta"
              icon="mail-outline"
              value={formData.email}
              onChangeText={v => updateField('email', v)}
              placeholder="isim@örnek.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password + strength */}
            <View>
              <LabeledInput
                label="Şifre"
                icon="lock-closed-outline"
                value={formData.password}
                onChangeText={v => updateField('password', v)}
                placeholder="En az 6 karakter"
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
                    {STR_LABELS[pwStr]}
                  </Text>
                </View>
              )}
            </View>

            {/* Terms checkbox */}
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
                  onPress={() => openLink('https://sites.google.com/view/bluma-terms-and-conditions')}
                >
                  Kullanım Koşulları
                </Text>
                {' '}ve{' '}
                <Text
                  variant="caption"
                  style={{ fontWeight: '700', color: colors.text }}
                  onPress={() => openLink('https://sites.google.com/view/bluma-privacy-policy')}
                >
                  Gizlilik Politikası
                </Text>
                {'\''}nı okudum, kabul ediyorum.
              </Text>
            </TouchableOpacity>

            <Button
              label={isLoading ? 'Hesap oluşturuluyor…' : 'Devam Et'}
              variant="primary"
              size="lg"
              iconRight="arrow-forward"
              onPress={handleEmailSignUp}
              disabled={!ready || isLoading}
              style={{ marginTop: 4 }}
            />

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
              <Text variant="caption" tone="textLight" style={s.dividerLabel}>veya</Text>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social buttons */}
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

          {/* Spacer + Footer */}
          <View style={{ flex: 1 }} />
          <View style={s.footer}>
            <Text variant="body" tone="textSecondary">Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text variant="body" tone="primary" style={{ fontWeight: '700' }}>Giriş yap</Text>
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
    marginTop: 20, lineHeight: 34,
  },
  form: { marginTop: 26, gap: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Radius.md, paddingHorizontal: 16, height: 56,
    borderWidth: 1.5,
  },
  textInput: { flex: 1, fontSize: 16 },
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

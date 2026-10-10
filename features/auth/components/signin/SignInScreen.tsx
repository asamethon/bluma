import { signInStyles as s } from '@/features/auth/styles/signInStyles';
import { AuthLabeledInput } from '@/features/auth/components/AuthLabeledInput';
import { AuthDivider } from '@/features/auth/components/AuthDivider';
import { AuthSocialButtons } from '@/features/auth/components/AuthSocialButtons';
import { useSignInForm } from '@/features/auth/hooks/useSignInForm';
import { BloomMark, Button, IconButton, Screen, Text } from '@/components/ui';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { useTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppSelector } from '@/store/hooks';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const form = useSignInForm();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const hasCompletedOnboarding = useAppSelector(s => s.auth.hasCompletedOnboarding);

  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthBackdrop />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[s.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconButton icon="arrow-back" size={40} iconSize={22} style={s.backBtn} onPress={() => {
              if (router.canGoBack()) router.back();
              else router.navigate("/(auth)/walkthrough");
            }} />

          <View style={s.hero}>
            <View style={s.brandRow}>
              <BloomMark size={24} color={colors.primary} coreColor={colors.bloom} />
              <Text variant="overline" tone="primary">BLUMA</Text>
            </View>
            <Text variant="display">{t('auth.welcomeBack')}</Text>
            <Text variant="body" tone="textSecondary" style={{ marginTop: 6 }}>
              {t('auth.welcomeBackSub')}
            </Text>
          </View>

          <View style={s.form}>
            <AuthLabeledInput
              label={t('auth.emailLabel')}
              icon="mail-outline"
              value={form.email}
              onChangeText={form.setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('auth.emailPlaceholder')}
            />

            <View>
              <AuthLabeledInput
                label={t('auth.passwordLabel')}
                icon="lock-closed-outline"
                value={form.password}
                onChangeText={form.setPassword}
                secureTextEntry={!form.showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                right={
                  <Pressable onPress={form.togglePassword}>
                    <Ionicons
                      name={form.showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.textLight}
                    />
                  </Pressable>
                }
              />
              <TouchableOpacity style={s.forgotRow} onPress={form.resetPassword}>
                <Text variant="label" tone="primary">
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              label={form.isLoading ? t('auth.signingIn') : t('auth.signIn')}
              variant="primary"
              size="lg"
              iconRight="arrow-forward"
              onPress={form.signInWithEmail}
              disabled={form.isLoading}
              style={{ marginTop: 4 }}
            />

            <AuthDivider label={t('auth.orContinueWith')} />
            <AuthSocialButtons
              disabled={form.isLoading}
              onApplePress={form.signInWithApple}
              onGooglePress={form.signInWithGoogle}
            />
          </View>

          <View style={{ flex: 1 }} />
          <View style={s.footer}>
            <Text variant="body" tone="textSecondary">{t('auth.noAccount')} </Text>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.push("/(auth)/signup");
              }}
            >
              <Text variant="bodyStrong" tone="primary">{t('auth.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

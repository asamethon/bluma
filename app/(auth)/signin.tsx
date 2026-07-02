import {
  Screen, Button, Text } from "@/components/ui";
import { Fonts, Radius, Spacing, useTheme } from "@/constants/theme";
import { authActions, authState$ } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { observer } from "@legendapp/state/react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";

/* ── Labeled input — label floats above, border turns violet on focus ─── */
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

export default observer(function SignInScreen() {
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = authState$.get();
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Hata", "Lütfen e-posta ve şifre alanlarını doldurun.");
      return;
    }
    const result = await authActions.signInWithEmail(email, password);
    if (!result.success)
      Alert.alert("Hata", result.error || "Giriş yapılırken bir hata oluştu.");
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    const result = await authActions.signInWithGoogle();
    if (!result.success)
      Alert.alert("Hata", result.error || "Google ile giriş yapılırken bir hata oluştu.");
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const result = await authActions.signInWithApple(credential);
      if (!result.success)
        Alert.alert("Hata", result.error || "Apple ile giriş yapılırken bir hata oluştu.");
    } catch (error: any) {
      if (error.code !== "ERR_CANCELED")
        Alert.alert("Hata", "Apple ile giriş yapılırken bir hata oluştu.");
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen önce e-posta adresinizi girin.");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    Alert.alert(
      "Şifre Sıfırlama",
      `${email} adresine şifre sıfırlama e-postası gönderilsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Gönder",
          onPress: async () => {
            const result = await authActions.resetPassword(email.trim());
            if (result.success)
              Alert.alert("Başarılı", "Şifre sıfırlama e-postası gönderildi.");
            else
              Alert.alert("Hata", result.error || "Şifre sıfırlama e-postası gönderilemedi.");
          },
        },
      ]
    );
  };

  const showApple = Platform.OS === "ios";

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
              else router.navigate("/(auth)/walkthrough");
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={[s.heading, { fontFamily: fonts.serif, color: colors.text }]}>
            Tekrar hoş geldin
          </Text>
          <Text variant="body" tone="textSecondary" style={{ marginTop: 6, lineHeight: 22 }}>
            Hikâyelerin seni bekliyor. Kaldığın yerden devam et.
          </Text>

          {/* Form */}
          <View style={s.form}>
            <LabeledInput
              label="E-posta"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="isim@örnek.com"
            />

            <View>
              <LabeledInput
                label="Şifre"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                right={
                  <Pressable onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.textLight}
                    />
                  </Pressable>
                }
              />
              <TouchableOpacity style={s.forgotRow} onPress={handleForgotPassword}>
                <Text variant="caption" tone="primary" style={{ fontWeight: "700" }}>
                  Şifremi unuttum
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              label={isLoading ? "Giriş yapılıyor…" : "Giriş Yap"}
              variant="primary"
              size="lg"
              iconRight="arrow-forward"
              onPress={handleEmailSignIn}
              disabled={isLoading}
              style={{ marginTop: 4 }}
            />

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
              <Text variant="caption" tone="textLight" style={s.dividerLabel}>
                veya şununla devam et
              </Text>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social buttons */}
            <View style={s.socialRow}>
              {showApple && (
                <TouchableOpacity
                  style={[s.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-apple" size={20} color={colors.text} />
                  <Text variant="label" style={{ fontWeight: "700", color: colors.text }}>Apple</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  s.socialBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  !showApple && { flex: undefined, width: "100%" },
                ]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={20} color={colors.text} />
                <Text variant="label" style={{ fontWeight: "700", color: colors.text }}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Spacer + Footer */}
          <View style={{ flex: 1 }} />
          <View style={s.footer}>
            <Text variant="body" tone="textSecondary">Hesabın yok mu? </Text>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.push("/(auth)/signup");
              }}
            >
              <Text variant="body" tone="primary" style={{ fontWeight: "700" }}>Kaydol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
});

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginLeft: -6,
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 20,
    lineHeight: 34,
  },
  form: { marginTop: 26, gap: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
  },
  textInput: { flex: 1, fontSize: 16 },
  forgotRow: { alignSelf: "flex-end", marginTop: 10 },
  dividerRow: { flexDirection: "row", alignItems: "center" },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontWeight: "600", paddingHorizontal: 14 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  footer: {
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

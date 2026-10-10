import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, Radius, Spacing, Typography, useTheme } from "@/constants/theme";
import { Text } from "./Text";

export interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  /** Çok satırlı alanlarda yükseklik; `multiline` ile birlikte kullanılır. */
  minHeight?: number;
  /** Arama gibi kompakt alanlarda kapsül formu kullanılabilir. */
  shape?: "rounded" | "pill";
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Metin alanı. Editoryal dilde kutu değil, ölçülü bir çerçeve: odaklanınca
 * yalnızca kenarlık rengi değişir — parlama/gölge yok.
 */
export function TextField({
  label,
  hint,
  error,
  icon,
  right,
  minHeight,
  shape = "rounded",
  multiline,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { colors, borders } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={containerStyle}>
      {!!label && (
        <Text variant="label" tone="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: borders.thin,
            alignItems: multiline ? "flex-start" : "center",
            minHeight: minHeight ?? 50,
            borderRadius: shape === "pill" ? Radius.pill : Radius.lg,
          },
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textLight} />}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.textLight}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: Fonts.sansRegular,
              fontSize: Typography.body.fontSize,
              lineHeight: multiline ? Typography.body.lineHeight : undefined,
              textAlignVertical: multiline ? "top" : "center",
            },
            style,
          ]}
        />
        {right}
      </View>

      {(!!error || !!hint) && (
        <Text variant="caption" color={error ? colors.error : colors.textLight} style={styles.hint}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.xs },
  field: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  input: { flex: 1, padding: 0, minWidth: 0 },
  hint: { marginTop: Spacing.xs },
});

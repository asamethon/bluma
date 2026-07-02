import { useTheme } from '@/constants/theme';
import React from 'react';
import { Animated, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

interface AnimatedFloatingInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  animValue: Animated.Value;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  multiline?: boolean;
  inputStyle?: TextInputProps['style'];
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  isError?: boolean;
  topExpanded?: number;
  topCollapsed?: number;
  footer?: React.ReactNode;
}

// Hikaye düzenleme ekranındaki başlık/içerik/açıklama/bölüm inputlarında
// tekrar eden animasyonlu floating-label deseni — tek yerde toplandı.
export function AnimatedFloatingInput({
  label,
  value,
  onChangeText,
  animValue,
  focused,
  onFocus,
  onBlur,
  multiline,
  inputStyle,
  containerStyle,
  maxLength,
  isError,
  topExpanded = 18,
  topCollapsed = -8,
  footer,
}: AnimatedFloatingInputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.floatingInputContainer, containerStyle]}>
      <Animated.Text
        style={[
          styles.floatingLabel,
          {
            top: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [topExpanded, topCollapsed],
            }),
            fontSize: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 12],
            }),
            color: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.textSecondary, colors.primary],
            }),
            backgroundColor: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['transparent', colors.background],
            }),
          },
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        style={[
          inputStyle,
          focused && styles.inputFocused,
          isError && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder=""
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        maxLength={maxLength}
      />
      {footer}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    floatingInputContainer: {
      marginBottom: 20,
      position: 'relative',
    },
    floatingLabel: {
      position: 'absolute',
      left: 12,
      fontSize: 16,
      color: colors.textSecondary,
      paddingHorizontal: 4,
      zIndex: 10,
      pointerEvents: 'none',
      fontWeight: '500',
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    inputError: {
      borderColor: colors.error,
    },
  });

import { useTheme } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

/**
 * Kimlik akışının tek dekoratif öğesi: sayfanın tepesinde ince bir marka
 * kuralı. Editoryal dilde arka planda ışık halesi/blob yoktur.
 */
export function AuthBackdrop() {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[styles.rule, { backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0 },
  rule: { height: 3 },
});

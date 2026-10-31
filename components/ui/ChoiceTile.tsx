import { Motion, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

/** Tek seçimli formlar için ikonlu, erişilebilir seçenek. */
export function ChoiceTile({ label, icon, selected, onPress }: Props) {
  const { colors, surfaces } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        surfaces.card,
        styles.tile,
        selected && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        { opacity: pressed ? Motion.pressOpacity : 1 },
      ]}
    >
      <View style={styles.icons}>
        <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={selected ? colors.primary : colors.borderStrong}
        />
      </View>
      <Text variant="bodyStrong" tone={selected ? 'primary' : 'textSecondary'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexGrow: 1, flexBasis: 140, minHeight: 92, padding: Spacing.lg, gap: Spacing.md },
  icons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

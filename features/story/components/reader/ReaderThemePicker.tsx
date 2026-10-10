import { Text } from '@/components/ui';
import { Motion, Radius, useTheme } from '@/constants/theme';
import { getReadingPalette, preferencesActions } from '@/store/preferencesStore';
import type { ReadingTheme } from '@/store/slices/preferencesSlice';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';

const THEMES: { key: ReadingTheme; label: string }[] = [
  { key: 'light', label: 'reader.themeLight' },
  { key: 'sepia', label: 'reader.themeSepia' },
  { key: 'dark', label: 'reader.themeDark' },
  { key: 'black', label: 'reader.themeBlack' },
];

type Props = { value: ReadingTheme; labelColor: string; borderColor: string };

/** Tema seçimi: renk kutucuğu değil, o temada gerçek bir "Aa" örneği. */
export function ReaderThemePicker({ value, labelColor, borderColor }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.themeRow}>
      {THEMES.map(theme => {
        const palette = getReadingPalette(theme.key) || colors;
        const selected = value === theme.key;
        return (
          <Pressable
            key={theme.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(theme.label)}
            onPress={() => void preferencesActions.setReadingTheme(theme.key)}
            style={({ pressed }) => [styles.themeOption, { opacity: pressed ? Motion.pressOpacity : 1 }]}
          >
            <View
              style={[
                styles.themeSwatch,
                {
                  backgroundColor: palette.background,
                  borderColor: selected ? colors.primary : borderColor,
                  borderWidth: selected ? 2 : 1,
                  borderRadius: Radius.sm,
                },
              ]}
            >
              <Text style={[styles.themeSwatchLetter, { color: palette.text }]}>Aa</Text>
            </View>
            <Text variant="labelSm" color={selected ? colors.primary : labelColor}>{t(theme.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

import { SegmentedControl, Sheet, Stepper, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import {
  READING_FONT_SIZE,
  READING_LINE_HEIGHT_MULTIPLIER,
  preferencesActions,
} from '@/store/preferencesStore';
import type { ReadingFont, ReadingLineSpacing } from '@/store/slices/preferencesSlice';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import { ReaderThemePicker } from './ReaderThemePicker';
import type { ReaderColors } from './types';

type Props = { visible: boolean; colors: ReaderColors; onClose: () => void };

/**
 * Okuma ayarları. Her seçim ÜSTTEKİ örnek metne anında yansır — kullanıcı
 * sayfayı kapatıp denemek zorunda kalmaz.
 */
export function ReaderSettingsSheet({ visible, colors: reading, onClose }: Props) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const theme = useAppSelector(state => state.preferences.readingTheme);
  const font = useAppSelector(state => state.preferences.readingFont);
  const spacing = useAppSelector(state => state.preferences.readingLineSpacing);
  const fontSize = useAppSelector(state => state.preferences.readingFontSize);
  const palette = {
    active: reading.text,
    inactive: reading.textSecondary,
    surface: reading.background,
    track: reading.border,
    indicator: colors.primary,
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('reader.settings')} palette={reading}>
      <View style={styles.settingsBlock}>
        <View style={[styles.previewBox, { backgroundColor: reading.background, borderColor: reading.border }]}>
          <Text
            numberOfLines={3}
            style={{
              color: reading.text,
              fontFamily: font === 'sans' ? fonts.sansRegular : fonts.serifRegular,
              fontSize,
              lineHeight: fontSize * READING_LINE_HEIGHT_MULTIPLIER[spacing],
            }}
          >
            {t('reader.sampleText')}
          </Text>
        </View>

        <View style={[styles.settingsRow, styles.settingsRowInline]}>
          <Text variant="label" color={reading.text}>{t('reader.fontSize')}</Text>
          <Stepper
            value={String(fontSize)}
            accessibilityLabel={t('reader.fontSize')}
            color={reading.text}
            surface={reading.background}
            border={reading.border}
            canDecrement={fontSize > READING_FONT_SIZE.min}
            canIncrement={fontSize < READING_FONT_SIZE.max}
            onDecrement={() => void preferencesActions.setReadingFontSize(fontSize - READING_FONT_SIZE.step)}
            onIncrement={() => void preferencesActions.setReadingFontSize(fontSize + READING_FONT_SIZE.step)}
          />
        </View>

        <View style={styles.settingsRow}>
          <Text variant="label" color={reading.text}>{t('reader.theme')}</Text>
          <ReaderThemePicker value={theme} labelColor={reading.textSecondary} borderColor={reading.border} />
        </View>

        <View style={styles.settingsRow}>
          <Text variant="label" color={reading.text}>{t('reader.fontFamily')}</Text>
          <SegmentedControl
            appearance="solid"
            palette={palette}
            value={font}
            options={[{ value: 'serif', label: 'Serif' }, { value: 'sans', label: 'Sans' }]}
            onChange={value => void preferencesActions.setReadingFont(value as ReadingFont)}
          />
        </View>

        <View style={styles.settingsRow}>
          <Text variant="label" color={reading.text}>{t('reader.lineSpacing')}</Text>
          <SegmentedControl
            appearance="solid"
            palette={palette}
            value={spacing}
            options={[
              { value: 'compact', label: t('reader.spacingCompact') },
              { value: 'normal', label: t('reader.spacingNormal') },
              { value: 'relaxed', label: t('reader.spacingRelaxed') },
            ]}
            onChange={value => void preferencesActions.setReadingLineSpacing(value as ReadingLineSpacing)}
          />
        </View>
      </View>
    </Sheet>
  );
}

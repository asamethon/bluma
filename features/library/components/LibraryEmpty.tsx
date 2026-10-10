import { BloomMark, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { libraryStyles as styles } from '@/features/library/styles/libraryStyles';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export function LibraryEmpty() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
      <Text variant="heading" center style={{ marginTop: Spacing.xl }}>
        {t('guest.library.title')}
      </Text>
      <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm, maxWidth: 280 }}>
        {t('library.emptySub')}
      </Text>
    </View>
  );
}

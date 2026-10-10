import { BloomMark, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function EmptyThreadState() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: top }}>
      <BloomMark size={48} color={colors.primaryLight} coreColor={colors.bloomLight} />
      <Text variant="body" tone="textLight">{t('messages.selectThread')}</Text>
    </View>
  );
}

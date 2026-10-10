import { BloomMark, Button, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <BloomMark size={56} color={colors.primaryLight} coreColor={colors.bloomLight} />
      <Text variant="heading" center style={{ marginTop: 20 }}>
        {t('notFound.title')}
      </Text>
      <Text variant="body" tone="textSecondary" center style={{ marginTop: 8, maxWidth: 280 }}>
        {t('notFound.message')}
      </Text>
      <Button
        label={t('notFound.goHome')}
        variant="primary"
        size="md"
        onPress={() => router.replace('/(tabs)' as any)}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

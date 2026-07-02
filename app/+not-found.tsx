import { BloomMark, Button, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

// Bilinmeyen rota (ör. eski/bozuk deep link) için yumuşak iniş ekranı.
export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <BloomMark size={56} color={colors.primaryLight} coreColor={colors.bloomLight} />
      <Text variant="heading" center style={{ marginTop: 20 }}>
        Bu sayfa bulunamadı
      </Text>
      <Text variant="body" tone="textSecondary" center style={{ marginTop: 8, maxWidth: 280 }}>
        Aradığın bağlantı taşınmış ya da hiç var olmamış olabilir.
      </Text>
      <Button
        label="Ana Sayfaya Dön"
        variant="primary"
        size="md"
        onPress={() => router.replace('/(tabs)' as any)}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

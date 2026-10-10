import { IconButton, Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { webViewStyles as styles } from '@/features/support/styles/webViewStyles';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const url = typeof params.url === 'string' ? params.url : undefined;
  const title = typeof params.title === 'string' ? params.title : 'Bluma';
  const [loading, setLoading] = useState(true);

  return (
    <Screen style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" iconSize={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.body}>
        {url ? (
          <WebView source={{ uri: url }} style={styles.webview} onLoadEnd={() => setLoading(false)} />
        ) : null}
        {loading && url ? (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

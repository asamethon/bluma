import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Uygulama içi WebView — yasal sayfaları (Gizlilik / Kullanım Koşulları) ve
// benzeri harici URL'leri uygulamadan çıkmadan gösterir.
// Kullanım: router.push('/webview?url=...&title=...'), bkz. utils/legal.ts
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
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.body}>
        {url ? (
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
          />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: { width: 24 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  body: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

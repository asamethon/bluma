import { useTheme } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Hikaye güncelleme sırasında gösterilen tam ekran yükleme overlay'i.
export function EditLoadingOverlay() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.modernLoadingOverlay}>
      <View style={styles.modernLoadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.modernLoadingText}>Hikayen güncelleniyor...</Text>
        <Text style={styles.modernLoadingSubtext}>Bu işlem birkaç saniye sürebilir</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    modernLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modernLoadingContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      minWidth: 200,
    },
    modernLoadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    modernLoadingSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
  });

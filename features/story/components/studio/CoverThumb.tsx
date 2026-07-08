import { categoryColor, Radius, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Küçük kitap-sırtı kapak küçük görseli — kapak varsa görsel, yoksa türün
// rengiyle bir kitap ikonu; solunda türün renk şeridi.
export function CoverThumb({
  coverImage,
  category,
  width = 46,
}: {
  coverImage?: string;
  category?: string;
  width?: number;
}) {
  const { colors } = useTheme();
  const tint = categoryColor(category);
  const height = width * 1.4;

  return (
    <View style={[styles.wrap, { width, height, backgroundColor: colors.surfaceVariant }]}>
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={styles.center}>
          <Ionicons name="book" size={width * 0.42} color={tint} />
        </View>
      )}
      <View style={[styles.spine, { backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
});

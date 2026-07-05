import { Radius } from '@/constants/theme';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet } from 'react-native';

interface StoryImageProps {
  uri: string;
}

// Hikaye içeriğine gömülü resim — okuyucu ve önizlemede ortak render.
export function StoryImage({ uri }: StoryImageProps) {
  return (
    <Image
      source={{ uri }}
      style={styles.image}
      contentFit="cover"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    marginVertical: 16,
    backgroundColor: '#00000010',
  },
});

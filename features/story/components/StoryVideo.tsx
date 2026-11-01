import { Ionicons } from '@expo/vector-icons';
import { alpha, Motion, Radius } from '@/constants/theme';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { StoryVideoPlayer } from './StoryVideoPlayer';

const ASPECT_RATIO = 16 / 9;

/**
 * Hikâye içi video: önce poster karesi durur, dokunulunca oynatıcı kurulur.
 * Otomatik oynatma YOK — okuma akışını bozmaz ve izlenmeyen videonun
 * trafiğini harcamaz (VPS bant genişliği izlenme başına sayılır).
 */
export function StoryVideo({ poster, video }: { poster: string; video: string }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  if (playing) return <StoryVideoPlayer uri={video} aspectRatio={ASPECT_RATIO} />;

  return (
    <Pressable
      onPress={() => setPlaying(true)}
      accessibilityRole="button"
      accessibilityLabel={t('reader.playVideo')}
      style={({ pressed }) => [styles.frame, { opacity: pressed ? Motion.pressOpacity : 1 }]}
    >
      <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" transition={150} />
      <View style={styles.badge}>
        <Ionicons name="play" size={26} color="#FFFFFF" style={styles.glyph} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: ASPECT_RATIO,
    borderRadius: Radius.lg,
    marginVertical: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000010',
  },
  poster: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  badge: {
    width: 58,
    height: 58,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha('#000000', 0.55),
  },
  // Üçgen ikon optik olarak sola kaçık durur; 2pt sağa alınır.
  glyph: { marginLeft: 2 },
});

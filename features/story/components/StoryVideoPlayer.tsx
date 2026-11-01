import { Radius } from '@/constants/theme';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';

/**
 * Oynatıcı AYRI bir bileşen: `useVideoPlayer` ilk dokunuşa kadar hiç
 * çağrılmaz, böylece bölümdeki her video için boşa oynatıcı kurulmaz.
 */
export function StoryVideoPlayer({ uri, aspectRatio }: { uri: string; aspectRatio: number }) {
  const player = useVideoPlayer(uri, instance => {
    instance.loop = false;
    instance.play();
  });

  return (
    <VideoView
      player={player}
      style={[styles.video, { aspectRatio }]}
      contentFit="contain"
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    borderRadius: Radius.lg,
    marginVertical: 16,
    backgroundColor: '#000',
  },
});

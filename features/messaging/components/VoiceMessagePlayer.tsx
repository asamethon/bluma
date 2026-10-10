import { Text } from '@/components/ui';
import { Motion, Radius, Spacing, alpha, useTheme } from '@/constants/theme';
import { formatVoiceDuration } from '@/features/messaging/utils/time';
import type { VoiceMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const BAR_COUNT = 26;

/** Kaydın adresinden türetilen sabit dalga: aynı mesaj her açılışta aynı görünür. */
const barsFor = (url: string) => {
  let seed = 0;
  for (let index = 0; index < url.length; index += 1) seed = (seed * 31 + url.charCodeAt(index)) >>> 0;
  return Array.from({ length: BAR_COUNT }, () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return 0.3 + ((seed >>> 16) % 100) / 140;
  });
};

type Props = { voice: VoiceMessage; mine: boolean };

export function VoiceMessagePlayer({ voice, mine }: Props) {
  const { colors } = useTheme();
  const player = useAudioPlayer({ uri: voice.url });
  const status = useAudioPlayerStatus(player);
  const bars = useMemo(() => barsFor(voice.url), [voice.url]);

  const tint = mine ? colors.onPrimary : colors.primary;
  const idle = mine ? alpha(colors.onPrimary, 0.4) : alpha(colors.primary, 0.25);
  const total = status.duration > 0 ? status.duration * 1000 : voice.durationMs;
  const elapsed = status.currentTime * 1000;
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;

  // Bitmiş kayıtta başa sarma BEKLENMELİ: `seekTo` bir söz döndürüyor ve
  // hemen ardından `play()` çağrılırsa sarma sonradan tamamlanıp çalmayı
  // sıfırlıyor (kayıt oynamıyormuş gibi görünüyordu).
  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || progress >= 1) await player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.play,
          { borderColor: alpha(tint, 0.5), opacity: pressed ? Motion.pressOpacity : 1 },
        ]}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={16} color={tint} />
      </Pressable>
      <View style={styles.wave}>
        {bars.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: 4 + height * 18,
                backgroundColor: index / BAR_COUNT <= progress ? tint : idle,
              },
            ]}
          />
        ))}
      </View>
      <Text variant="labelSm" color={mine ? alpha(colors.onPrimary, 0.85) : colors.textSecondary}>
        {formatVoiceDuration(status.playing || progress > 0 ? elapsed : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minWidth: 210 },
  play: {
    width: 34, height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  wave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 26 },
  bar: { flex: 1, borderRadius: Radius.pill, minWidth: 2 },
});

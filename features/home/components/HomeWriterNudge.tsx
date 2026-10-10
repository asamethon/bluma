import { useTheme } from '@/constants/theme';
import { WriterNudgeCard } from '@/features/story/components/WriterNudgeCard';
import { useWriterActivation } from '@/features/story/hooks/useWriterActivation';
import { useMemo } from 'react';
import { View } from 'react-native';
import { createHomeStyles } from '../styles/homeStyles';

/** Henüz yazmamış kullanıcıya günün yazma konusu (yalnızca tür seçili değilken). */
export function HomeWriterNudge() {
  const { colors } = useTheme();
  const writer = useWriterActivation();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  if (!writer.showCard) return null;

  return (
    <View style={styles.writerNudge}>
      <WriterNudgeCard
        prompt={writer.prompt}
        starting={writer.starting}
        onStart={writer.startBlank}
        onStartWithPrompt={writer.startWithPrompt}
      />
    </View>
  );
}

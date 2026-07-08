import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { StoryInfoForm } from '@/features/story/components/studio/StoryInfoForm';
import { useStoryInfoForm } from '@/features/story/hooks/useStoryInfoForm';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Yeni hikâye — bilgi formu. Kaydet → taslak dokümanı oluşturur ve composer'a
// geçer (useStoryInfoForm içinde).
export default function NewStoryScreen() {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const form = useStoryInfoForm();

  return (
    <Screen edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StoryInfoForm form={form} safeBottom={bottom} />
    </Screen>
  );
}

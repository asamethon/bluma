import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { StoryInfoForm } from '@/features/story/components/studio/StoryInfoForm';
import { useStoryInfoForm } from '@/features/story/hooks/useStoryInfoForm';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StoryEditScreen() {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const form = useStoryInfoForm(id);

  return (
    <Screen edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {form.loadingStory ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <StoryInfoForm form={form} safeBottom={bottom} />
      )}
    </Screen>
  );
}

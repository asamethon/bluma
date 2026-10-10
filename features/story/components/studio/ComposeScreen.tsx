import { Screen } from '@/components/ui';
import { ContentMaxWidth, Spacing, useTheme } from '@/constants/theme';
import { ChapterSwitcherSheet } from '@/features/story/components/studio/ChapterSwitcherSheet';
import { ComposerBottomBar } from '@/features/story/components/studio/ComposerBottomBar';
import { ComposerCanvas } from '@/features/story/components/studio/ComposerCanvas';
import { ComposerHeader } from '@/features/story/components/studio/ComposerHeader';
import { ComposerPreview } from '@/features/story/components/studio/ComposerPreview';
import { useComposer } from '@/features/story/hooks/useComposer';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ComposeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, ch } = useLocalSearchParams<{ id: string; ch?: string }>();
  const c = useComposer(id ?? '', ch);

  if (c.loading) {
    return (
      <Screen edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ComposerHeader c={c} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, paddingTop: Spacing.sm, width: '100%', maxWidth: ContentMaxWidth.content, alignSelf: 'center' }}>
          <ComposerCanvas c={c} />
        </View>
        <ComposerBottomBar c={c} bottomInset={insets.bottom} />
      </KeyboardAvoidingView>

      <ChapterSwitcherSheet c={c} />
      <ComposerPreview c={c} topInset={insets.top} />
    </Screen>
  );
}

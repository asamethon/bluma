import { Button, PageHeader, Screen } from '@/components/ui';
import { CategoryMeta, ContentMaxWidth, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { useResponsive } from '@/hooks/useResponsive';
import { storyActions } from '@/store/storyStore';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStoryPreview } from '../../hooks/useStoryPreview';
import { createStoryPreviewStyles } from '../../styles/storyPreviewStyles';
import { StoryPreviewCarousel } from './StoryPreviewCarousel';
import { StoryPreviewDetails } from './StoryPreviewDetails';
import { StoryPreviewSaveButton } from './StoryPreviewSaveButton';
import { StoryPreviewStatus } from './StoryPreviewStatus';

/**
 * Önizleme kaydırılmaz: künye ve aksiyon sabit yükseklikte durur, kapak
 * geriye kalan alanı doldurur. Böylece kapaklar arasında gezerken konum
 * şeridi, başlık ve "Okumaya Başla" hep aynı yerdedir.
 */
export function StoryPreviewScreen({ storyId }: { storyId: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const { requireAuth } = useGuestGate();
  const preview = useStoryPreview(storyId);
  const access = useProfileAccess(preview.current?.author);
  const styles = useMemo(() => createStoryPreviewStyles(colors), [colors]);

  const current = preview.current;
  const blocked = access.locked || access.checking;
  const title = current?.isEditorsPick
    ? t('home.editorsPick')
    : current?.category
      ? t(CategoryMeta[current.category].label)
      : t('tabs.discover');

  const open = useCallback(() => {
    if (current) router.push(`/story/${current.id}/info` as never);
  }, [current, router]);
  const save = useCallback(() => {
    if (current && requireAuth('save')) void storyActions.saveStory(current.id);
  }, [current, requireAuth]);
  const openAuthor = useCallback(() => {
    if (current?.authorId) router.push(`/user/${current.authorId}` as never);
  }, [current?.authorId, router]);

  return (
    <Screen edges={['bottom']} maxContentWidth={ContentMaxWidth.content} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader
        title={title}
        topInset={insets.top}
        bordered={false}
        onBack={router.back}
        right={current && !blocked ? <StoryPreviewSaveButton storyId={current.id} onPress={save} /> : undefined}
      />

      {preview.loading ? (
        <StoryPreviewStatus kind="loading" styles={styles} />
      ) : blocked ? (
        <StoryPreviewStatus
          kind={access.locked ? 'private' : 'private-check'}
          authorName={current?.author?.displayName}
          styles={styles}
        />
      ) : current ? (
        <>
          <StoryPreviewCarousel
            stories={preview.stories}
            columnWidth={Math.min(width, ContentMaxWidth.content)}
            styles={styles}
            onSelect={preview.select}
            onOpen={open}
          />
          <StoryPreviewDetails story={current} styles={styles} onAuthorPress={openAuthor} />
          <View style={styles.cta}>
            <Button label={t('storyScreen.startReading')} icon="book-outline" size="lg" fullWidth onPress={open} />
          </View>
        </>
      ) : (
        <StoryPreviewStatus kind="missing" styles={styles} />
      )}
    </Screen>
  );
}

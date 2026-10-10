import OfflineIndicator from '@/components/ui/OfflineIndicator';
import { EmptyState, IconButton, Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { ShareStorySheet } from '@/features/messaging/components/ShareStorySheet';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { useStoryInfo } from '@/features/story/hooks/useStoryInfo';
import { createStoryInfoStyles } from '@/features/story/styles/storyInfoStyles';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';
import { StoryChapterItem } from './StoryChapterRow';
import { StoryInfoContent } from './StoryInfoContent';

const toDate = (value: unknown) => {
  if (!value) return null;
  const candidate = value as { toDate?: () => Date };
  const date = candidate.toDate?.() ?? new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function StoryInfoScreen({ storyId }: { storyId: string }) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const info = useStoryInfo(storyId);
  const userId = useAppSelector(state => state.auth.user?.id);
  const access = useProfileAccess(info.story?.author);
  const styles = useMemo(() => createStoryInfoStyles(colors), [colors]);
  const chapters = useMemo<StoryChapterItem[]>(() => {
    const count = Math.max(1, info.story?.chaptersCount || 1);
    const titles = info.story?.chapterTitles?.length
      ? info.story.chapterTitles
      : Array.from({ length: count }, (_, index) => t('story.chapterN', { number: index + 1 }));
    return titles.map((title, index) => ({
      id: String(index + 1),
      index,
      title: info.story?.chapterTitles?.length
        ? `${t('story.chapterN', { number: index + 1 })} · ${title}`
        : title,
    }));
  }, [info.story, t]);
  const openAuthor = useCallback(() => {
    if (info.story?.authorId) router.push(`/user/${info.story.authorId}` as never);
  }, [info.story?.authorId, router]);
  const share = useCallback(() => {
    const story = info.story;
    if (story && story.authorId === userId && story.isPublished) {
      router.push(`/story/${storyId}/launch` as never);
      return;
    }
    info.openShare();
  }, [info, router, storyId, userId]);
  const updated = toDate(info.story?.updatedAt);
  const updatedLabel = updated
    ? t('story.lastUpdated', { date: updated.toLocaleDateString(i18n.language) })
    : undefined;
  const blocked = access.locked || access.checking;

  return (
    <Screen edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <OfflineIndicator showWhenOnline />
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <IconButton icon="arrow-back" iconSize={22} size={38} onPress={router.back} style={{ marginLeft: -10 }} />
      </View>
      {info.loading || access.checking ? (
        <View style={styles.status}><ActivityIndicator color={colors.primary} /></View>
      ) : access.locked ? (
        <View style={styles.status}><PrivateProfileNotice name={info.story?.author?.displayName?.split(' ')[0]} /></View>
      ) : info.story ? (
        <StoryInfoContent
          chapters={chapters}
          downloaded={info.downloaded}
          downloading={info.downloading}
          saved={info.saved}
          savedChapter={info.savedChapter}
          story={info.story}
          styles={styles}
          updatedLabel={updatedLabel}
          onAuthorPress={openAuthor}
          onDownload={info.toggleDownload}
          onRead={info.startReading}
          onSave={info.toggleSave}
          onShare={share}
        />
      ) : (
        <EmptyState icon="document-outline" title={t('story.notFound')} />
      )}
      {!blocked && (
        <ShareStorySheet
          visible={info.shareVisible}
          onClose={info.closeShare}
          onShareLink={info.shareLink}
          story={info.story ? {
            id: storyId,
            title: info.story.title,
            coverImage: info.story.coverImage,
            authorName: info.story.author?.displayName || info.story.author?.username,
          } : null}
        />
      )}
    </Screen>
  );
}

import { EmptyState, IconButton, Screen, SegmentedControl, Text } from '@/components/ui';
import { ContentMaxWidth, Radius, Spacing, useTheme } from '@/constants/theme';
import { useBookLaunch } from '@/features/launch/hooks/useBookLaunch';
import { useStoryPreview } from '@/features/story/hooks/useStoryPreview';
import { useAppSelector } from '@/store/hooks';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ARTWORK_EXPORT_WIDTH } from './artworkStyles';
import { BookLaunchArtwork } from './BookLaunchArtwork';
import { LaunchShareActions } from './LaunchShareActions';

export function BookLaunchScreen({ storyId }: { storyId: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAppSelector(state => state.auth.user?.id);
  const preview = useStoryPreview(storyId);
  const story = preview.current;
  const launch = useBookLaunch(story);
  const allowed = !!story && story.isPublished && story.authorId === userId;

  return (
    <Screen edges={[]} style={{ backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, borderBottomColor: colors.divider }]}>
        <IconButton icon="close" onPress={router.back} />
        <View style={styles.headerCopy}>
          <Text variant="heading" center>{t('launch.title')}</Text>
          <Text variant="caption" tone="textLight" center>{t('launch.subtitle')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {preview.loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : !allowed ? (
        <View style={styles.center}>
          <EmptyState icon="lock-closed-outline" title={t('launch.unavailable')} description={t('launch.ownerOnly')} />
        </View>
      ) : (
        <>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
          <SegmentedControl
            appearance="solid"
            value={launch.format}
            options={[
              { value: 'story', label: t('launch.storyFormat'), icon: 'phone-portrait-outline' },
              { value: 'post', label: t('launch.postFormat'), icon: 'square-outline' },
            ]}
            onChange={value => launch.setFormat(value as 'story' | 'post')}
          />
          <View style={[
            styles.previewFrame,
            launch.format === 'story' ? styles.previewStory : styles.previewPost,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
            <BookLaunchArtwork story={story!} format={launch.format} />
          </View>
          <LaunchShareActions ready={launch.artworkReady} sharing={launch.sharing} onShare={launch.share} />
        </ScrollView>

        {/* Dışa aktarım kaynağı: ekran dışında, tam tasarım genişliğinde çizilir ki
            paylaşılan görsel küçük önizlemeden büyütülmüş bulanık bir kopya olmasın. */}
        <View style={styles.captureHost} pointerEvents="none">
          <ViewShot ref={launch.artworkRef} style={styles.captureArtwork}>
            <BookLaunchArtwork story={story!} format={launch.format} onCoverReady={launch.markCoverReady} />
          </ViewShot>
        </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 68, paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  headerCopy: { flex: 1 },
  headerSpacer: { width: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  content: { padding: Spacing.screenX, gap: Spacing.xl },
  previewFrame: { alignSelf: 'center', padding: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  previewStory: { width: '58%' },
  previewPost: { width: '82%' },
  captureHost: { position: 'absolute', top: 0, left: -ARTWORK_EXPORT_WIDTH * 2 },
  captureArtwork: { width: ARTWORK_EXPORT_WIDTH },
});

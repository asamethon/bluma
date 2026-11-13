import { Button, EmptyState, IconButton, Screen, Text } from '@/components/ui';
import { ContentMaxWidth, Radius, Spacing, useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { isFounder } from '../constants';
import { useMilestoneCard } from '../hooks/useMilestoneCard';
import { MilestoneArtwork } from './MilestoneArtwork';
import { MILESTONE_EXPORT_WIDTH } from './milestoneArtworkStyles';

export function MilestoneScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const card = useMilestoneCard();
  const founder = useAppSelector(s => isFounder(s.auth.user?.memberNumber));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <Screen edges={[]} style={{ backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerSpacer} />
        <Text variant="overline" tone="textLight" center style={styles.headerTitle}>{t('milestone.title')}</Text>
        <IconButton icon="close" onPress={close} accessibilityLabel={t('milestone.close')} />
      </View>

      {card.loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : !card.milestone ? (
        <View style={styles.center}>
          <EmptyState icon="sparkles-outline" title={t('milestone.unavailable')} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(450)} style={styles.intro}>
              <Text variant="title" center>{t('milestone.headline')}</Text>
              <Text variant="body" tone="textSecondary" center>{t(founder ? 'milestone.thanksFounder' : 'milestone.thanks')}</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(150).duration(500)} style={[styles.previewFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MilestoneArtwork stats={card.milestone.stats} />
            </Animated.View>
            <View style={styles.actions}>
              <Button
                label={t('milestone.instagramStory')}
                icon="logo-instagram"
                fullWidth
                loading={card.sharing === 'instagramStory'}
                disabled={card.sharing === 'message'}
                onPress={() => card.share('instagramStory')}
              />
              <Button
                label={t('milestone.message')}
                icon="paper-plane-outline"
                variant="outline"
                fullWidth
                loading={card.sharing === 'message'}
                disabled={card.sharing === 'instagramStory'}
                onPress={() => card.share('message')}
              />
              <Text variant="caption" tone="textLight" center>{t('launch.linkHint')}</Text>
            </View>
          </ScrollView>

          {/* Dışa aktarım kaynağı: ekran dışında tam genişlikte çizilir (bkz. BookLaunchScreen). */}
          <View style={styles.captureHost} pointerEvents="none">
            <ViewShot ref={card.artworkRef} style={styles.captureArtwork}>
              <MilestoneArtwork stats={card.milestone.stats} />
            </ViewShot>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1 },
  headerSpacer: { width: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  content: { paddingHorizontal: Spacing.screenX, gap: Spacing.xl },
  intro: { gap: Spacing.sm, paddingTop: Spacing.sm },
  previewFrame: { alignSelf: 'center', width: '62%', padding: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  actions: { gap: Spacing.md },
  captureHost: { position: 'absolute', top: 0, left: -MILESTONE_EXPORT_WIDTH * 2 },
  captureArtwork: { width: MILESTONE_EXPORT_WIDTH },
});

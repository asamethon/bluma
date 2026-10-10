import { Button, Skeleton, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  kind: 'loading' | 'missing' | 'hidden' | 'private-check' | 'private';
  safeTop: number;
  authorName?: string;
  onBack: () => void;
};

const LINES = ['96%', '99%', '92%', '97%', '88%', '99%', '58%'] as const;

export function ReaderUnavailable({ kind, safeTop, authorName, onBack }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const base = { backgroundColor: colors.background, paddingTop: safeTop };

  if (kind === 'private-check') return <View style={[styles.page, base]} />;

  // Yüklenirken boş ekran yerine sayfanın kendi iskeleti: okur nereye
  // baktığını bilir, geçiş sıçramaz.
  if (kind === 'loading') {
    return (
      <View style={[styles.loading, base]}>
        <Skeleton width="38%" height={12} />
        <Skeleton width="86%" height={30} style={styles.loadingTitle} />
        <Skeleton width="52%" height={14} />
        <View style={styles.loadingBody}>
          {LINES.map((width, index) => <Skeleton key={`${width}-${index}`} width={width} height={13} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.page, base]}>
      {kind === 'missing' && <Text variant="body" tone="textSecondary">{t('story.notFound')}</Text>}
      {kind === 'hidden' && (
        <>
          <Ionicons name="eye-off-outline" size={40} color={colors.textSecondary} />
          <Text variant="body" tone="textSecondary" style={styles.message}>{t('moderation.storyRemoved')}</Text>
        </>
      )}
      {kind === 'private' && <PrivateProfileNotice name={authorName?.split(' ')[0]} />}
      <Button label={t('userProfile.goBack')} variant="ghost" size="sm" onPress={onBack} style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxxl },
  message: { marginTop: Spacing.md, textAlign: 'center' },
  back: { marginTop: Spacing.md },
  loading: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.huge, gap: Spacing.md },
  loadingTitle: { marginTop: Spacing.md },
  loadingBody: { gap: Spacing.md, marginTop: Spacing.xxl },
});

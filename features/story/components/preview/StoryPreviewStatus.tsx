import { EmptyState, Skeleton } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { createStoryPreviewStyles } from '../../styles/storyPreviewStyles';

type Props = {
  kind: 'loading' | 'missing' | 'private-check' | 'private';
  authorName?: string;
  styles: ReturnType<typeof createStoryPreviewStyles>;
};

export function StoryPreviewStatus({ kind, authorName, styles }: Props) {
  const { t } = useTranslation();

  // Takipçi kontrolü sürerken karar kesinleşmemiştir: hiçbir şey gösterme.
  if (kind === 'private-check') return null;

  if (kind === 'private') {
    return (
      <View style={styles.status}>
        <PrivateProfileNotice name={authorName?.split(' ')[0]} />
      </View>
    );
  }

  // Yükleme, gelecek düzenin iskeletini çizer — spinner yerine sayfanın kendisi.
  if (kind === 'loading') {
    return (
      <View style={styles.skeleton}>
        <Skeleton style={styles.skeletonCard} radius={Radius.lg} />
        <Skeleton width={90} height={11} />
        <Skeleton width="62%" height={26} />
        <Skeleton width="34%" height={13} />
      </View>
    );
  }

  return <EmptyState icon="document-outline" title={t('story.notFound')} />;
}

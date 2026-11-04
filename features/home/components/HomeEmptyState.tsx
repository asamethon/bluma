import { BloomMark, SkeletonRow, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Props = {
  /** Tür seçiliyken boş liste "bu türde hikâye yok" demektir. */
  genre: boolean;
  styles: { empty: object; emptyTitle: object; emptySubtitle: object; loadMore: object };
};

/**
 * Ana sayfa listesi boşken gösterilen alan.
 *
 * Açılış perdesi akışı en fazla 3 sn bekler; akış o sürede gelmezse liste boş
 * açılıyordu ve kullanıcı 1-2 sn "Bahçe henüz boş" görüyordu. Akış henüz hiç
 * yüklenmediyse boş durum yerine iskelet gösterilir; "boş" yalnızca yükleme
 * bittikten sonra söylenir.
 */
export function HomeEmptyState({ genre, styles }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const storiesLoaded = useAppSelector(state => state.story.storiesLoaded);

  if (!genre && !storiesLoaded) {
    return (
      <View style={styles.loadMore}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    );
  }
  return (
    <View style={styles.empty}>
      <BloomMark size={genre ? 64 : 52} color={colors.primaryLight} coreColor={colors.bloomLight} />
      {!genre && <Text variant="titleSm" center style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>}
      <Text variant="body" tone="textSecondary" center style={styles.emptySubtitle}>
        {genre ? t('home.noStoriesInGenre') : t('home.emptySub')}
      </Text>
    </View>
  );
}

import { SectionHeader, Text } from '@/components/ui';
import { CategoryMeta } from '@/constants/categories';
import { Motion, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { CategoryEntry } from '../services/categoryRanking';
import { createHomeStyles } from '../styles/homeStyles';

type Props = { categories: CategoryEntry[]; onSelect: (id: string) => void };

/**
 * Tür gezintisi: bütün türler tek bakışta. Boş tür de görünür — okurun
 * katalogda nelerin olduğunu bilmesi, yalnız dolu rafları görmesinden önemli.
 */
function HomeCategoriesSectionView({ categories, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <SectionHeader title={t('home.categories')} />
      <View style={styles.categoryGrid}>
        {categories.map(entry => {
          const meta = CategoryMeta[entry.id];
          return (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={t(meta.label)}
              onPress={() => onSelect(entry.id)}
              style={({ pressed }) => [
                styles.categoryTile,
                { borderColor: colors.border, opacity: pressed ? Motion.pressOpacity : 1 },
              ]}
            >
              <Ionicons name={meta.icon as never} size={18} color={meta.color} />
              <View style={styles.categoryTileText}>
                <Text variant="label" numberOfLines={1}>{t(meta.label)}</Text>
                <Text variant="caption" tone="textLight">
                  {t('home.categoryCount', { count: entry.count })}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const HomeCategoriesSection = memo(HomeCategoriesSectionView);

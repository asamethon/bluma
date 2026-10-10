import { CategoryChip, SectionHeader, Text, TextField } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchStyles as styles } from '../styles/searchStyles';
import { SEARCH_GENRES } from '../types';

type Props = {
  topInset: number;
  query: string;
  genre: string | null;
  onQueryChange: (query: string) => void;
  onGenreChange: (genre: string | null) => void;
  onSubmitQuery: (query: string) => void;
};

export function SearchControls({
  topInset,
  query,
  genre,
  onQueryChange,
  onGenreChange,
  onSubmitQuery,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <View style={[styles.headerRow, { paddingTop: topInset + 16 }]}>
        <Text variant="overline" tone="textLight">{t('tabs.search')}</Text>
        <Text variant="display" numberOfLines={1}>{t('tabs.discover')}</Text>
      </View>

      <TextField
        icon="search-outline"
        shape="pill"
        placeholder={t('search.placeholder')}
        value={query}
        onChangeText={onQueryChange}
        returnKeyType="search"
        onSubmitEditing={() => onSubmitQuery(query)}
        containerStyle={styles.searchBar}
        right={query.length > 0 ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </Pressable>
        ) : undefined}
      />

      <View style={styles.sectionSpacing}>
        <SectionHeader title={t('search.genres')} />
        <View style={styles.genreGrid}>
          {SEARCH_GENRES.map(item => (
            <CategoryChip
              key={item}
              category={item}
              active={genre === item}
              shape="pill"
              onPress={() => onGenreChange(genre === item ? null : item)}
            />
          ))}
        </View>
      </View>
    </>
  );
}

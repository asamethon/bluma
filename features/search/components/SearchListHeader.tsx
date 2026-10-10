import { Badge, Text } from '@/components/ui';
import { CategoryMeta, useTheme } from '@/constants/theme';
import type { User } from '@/types';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SearchHistoryItem } from '../types';
import { searchStyles as styles } from '../styles/searchStyles';
import { RecentSearches } from './RecentSearches';
import { SearchControls } from './SearchControls';
import { SearchUserResults } from './SearchUserResults';

type Props = {
  topInset: number;
  query: string;
  genre: string | null;
  idle: boolean;
  busy: boolean;
  resultCount: number;
  users: User[];
  history: SearchHistoryItem[];
  onQueryChange: (query: string) => void;
  onGenreChange: (genre: string | null) => void;
  onSubmitQuery: (query: string) => void;
  onClearHistory: () => void;
  onOpenHistory: (item: SearchHistoryItem) => void;
  onRemoveHistory: (index: number) => void;
  onOpenUser: (userId: string, position: number) => void;
};

export function SearchListHeader(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const resultTitle = props.genre
    ? (CategoryMeta[props.genre] ? t(CategoryMeta[props.genre].label) : props.genre)
    : props.query ? `"${props.query}"` : t('search.allResults');

  return (
    <>
      <SearchControls
        topInset={props.topInset}
        query={props.query}
        genre={props.genre}
        onQueryChange={props.onQueryChange}
        onGenreChange={props.onGenreChange}
        onSubmitQuery={props.onSubmitQuery}
      />
      {props.idle && (
        <RecentSearches
          items={props.history}
          onClear={props.onClearHistory}
          onOpen={props.onOpenHistory}
          onRemove={props.onRemoveHistory}
        />
      )}
      {!props.idle && (
        <View style={styles.sectionSpacing}>
          <View style={styles.rowBetween}>
            <Text variant="heading" style={{ fontSize: 18, fontWeight: '700' }}>
              {resultTitle}
            </Text>
            <Badge label={t('lists.storyCount', { count: props.resultCount })} tone="neutral" />
          </View>
        </View>
      )}
      <SearchUserResults users={props.users} onOpen={props.onOpenUser} />
      {props.busy && <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />}
    </>
  );
}

import { IconButton, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useReadingLists } from '@/features/library/hooks/useReadingLists';
import { readingListStyles as styles } from '@/features/library/styles/readingListStyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { CreateListRow } from './CreateListRow';
import { ReadingListRow } from './ReadingListRow';
import { ReadingListsEmpty } from './ReadingListsEmpty';

export default function ReadingListsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const model = useReadingLists();

  return (
    <Screen style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" iconSize={24} onPress={() => router.back()} />
        <Text variant="subheading" style={styles.headerTitle}>{t('lists.myLists')}</Text>
        <IconButton
          icon={model.creating ? 'close' : 'add'}
          size={40}
          iconSize={24}
          color={colors.primary}
          accessibilityLabel={t(model.creating ? 'common.cancel' : 'lists.createNew')}
          onPress={model.toggleCreating}
        />
      </View>

      {model.creating ? (
        <CreateListRow value={model.draftName} onChange={model.setDraftName} onSubmit={model.create} />
      ) : null}

      <FlatList
        data={model.isSignedIn ? model.lists : []}
        keyExtractor={list => list.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={model.refreshing} onRefresh={model.onRefresh} />}
        ListEmptyComponent={
          model.loaded || !model.isSignedIn ? <ReadingListsEmpty isSignedIn={model.isSignedIn} /> : null
        }
        renderItem={({ item }) => (
          <ReadingListRow
            list={item}
            onOpen={id => router.push(`/profile/list/${id}`)}
            onDelete={model.confirmDelete}
          />
        )}
      />
    </Screen>
  );
}

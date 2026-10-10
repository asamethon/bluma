import { Sheet } from '@/components/ui';
import { addToListStyles as styles } from '@/features/library/styles/addToListStyles';
import { useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { readingListActions } from '@/store/readingListStore';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  storyId: string | null;
}

export default function AddToListSheet({ visible, onClose, storyId }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const lists = useAppSelector(s => s.readingList.lists);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (visible) readingListActions.loadLists();
  }, [visible]);

  const toggle = (listId: string) => {
    if (!storyId) return;
    if (readingListActions.isInList(listId, storyId)) {
      readingListActions.removeStory(listId, storyId);
    } else {
      readingListActions.addStory(listId, storyId);
    }
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const r = await readingListActions.createList(name);
    if (r.success) {
      setNewName('');
      setCreating(false);
      if (storyId && r.listId) readingListActions.addStory(r.listId, storyId);
    } else {
      Alert.alert(t('common.error'), r.error || t('lists.createFailed'));
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} contentStyle={styles.body}>
      <Text style={[styles.title, { color: colors.text }]}>{t('lists.addToList')}</Text>

      <FlatList
        style={styles.listArea}
        data={lists}
        keyExtractor={list => list.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('lists.emptyHint')}</Text>
        }
        renderItem={({ item: list }) => {
          const inList = !!storyId && list.storyIds.includes(storyId);
          return (
            <TouchableOpacity style={styles.listRow} onPress={() => toggle(list.id)}>
              <View style={[styles.listIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="bookmarks-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.listBody}>
                <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>{list.name}</Text>
                <Text style={[styles.listCount, { color: colors.textSecondary }]}>
                  {t('lists.storyCount', { count: list.storyIds.length })}
                </Text>
              </View>
              <Ionicons
                name={inList ? 'checkmark-circle' : 'add-circle-outline'}
                size={24}
                color={inList ? colors.success : colors.textLight}
              />
            </TouchableOpacity>
          );
        }}
      />

      {creating ? (
        <View style={styles.createRow}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={newName}
            onChangeText={setNewName}
            placeholder={t('lists.newListPlaceholder')}
            placeholderTextColor={colors.textLight}
            autoFocus
            maxLength={60}
            onSubmitEditing={create}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={create}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.newListBtn, { borderColor: colors.border }]} onPress={() => setCreating(true)}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={[styles.newListText, { color: colors.primary }]}>{t('lists.createNew')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.done} onPress={onClose}>
        <Text style={[styles.doneText, { color: colors.textSecondary }]}>{t('common.done')}</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

import { Radius, Spacing, useTheme } from '@/constants/theme';
import { readingListActions, readingListState$ } from '@/store/readingListStore';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  storyId: string | null;
}

export default observer(function AddToListSheet({ visible, onClose, storyId }: Props) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const lists = readingListState$.lists.get();
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
      Alert.alert('Hata', r.error || 'Liste oluşturulamadı.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Listeye ekle</Text>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {lists.length === 0 && (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                Henüz bir okuma listen yok. Aşağıdan ilkini oluştur.
              </Text>
            )}
            {lists.map(list => {
              const inList = !!storyId && list.storyIds.includes(storyId);
              return (
                <TouchableOpacity key={list.id} style={styles.listRow} onPress={() => toggle(list.id)}>
                  <View style={[styles.listIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="bookmarks-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>{list.name}</Text>
                    <Text style={[styles.listCount, { color: colors.textSecondary }]}>{list.storyIds.length} hikâye</Text>
                  </View>
                  <Ionicons
                    name={inList ? 'checkmark-circle' : 'add-circle-outline'}
                    size={24}
                    color={inList ? colors.success : colors.textLight}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {creating ? (
            <View style={styles.createRow}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Yeni liste adı"
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
              <Text style={[styles.newListText, { color: colors.primary }]}>Yeni liste oluştur</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.done} onPress={onClose}>
            <Text style={[styles.doneText, { color: colors.textSecondary }]}>Bitti</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 20, lineHeight: 20 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listName: { fontSize: 15, fontWeight: '600' },
  listCount: { fontSize: 12, marginTop: 1 },
  createRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  createBtn: { width: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  newListBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: Radius.pill, borderWidth: 1, marginTop: 10,
  },
  newListText: { fontSize: 15, fontWeight: '700' },
  done: { paddingVertical: 14, alignItems: 'center' },
  doneText: { fontSize: 15, fontWeight: '600' },
});

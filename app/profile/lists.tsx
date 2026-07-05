import { Screen, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { readingListActions } from '@/store/readingListStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReadingListsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);
  const lists = useAppSelector(s => s.readingList.lists);
  const loaded = useAppSelector(s => s.readingList.loaded);

  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (currentUser?.id) readingListActions.loadLists();
  }, [currentUser?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await readingListActions.loadLists();
    setRefreshing(false);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const r = await readingListActions.createList(name);
    if (r.success) { setNewName(''); setCreating(false); }
    else Alert.alert('Hata', r.error || 'Liste oluşturulamadı.');
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Listeyi sil', `"${name}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => readingListActions.deleteList(id) },
    ]);
  };

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="subheading" style={{ fontWeight: '700' }}>Okuma Listelerim</Text>
        <TouchableOpacity onPress={() => setCreating(c => !c)} style={styles.headerBtn}>
          <Ionicons name={creating ? 'close' : 'add'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {creating && (
        <View style={styles.createRow}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
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
      )}

      <ScrollView
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {!currentUser?.id ? (
          <View style={styles.empty}>
            <Ionicons name="log-in-outline" size={44} color={colors.textSecondary} />
            <Text variant="body" tone="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
              Listelerini görmek için giriş yap.
            </Text>
          </View>
        ) : loaded && lists.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bookmarks-outline" size={44} color={colors.primaryLight} />
            <Text variant="subheading" style={{ marginTop: 12, fontWeight: '700' }}>Henüz liste yok</Text>
            <Text variant="body" tone="textSecondary" style={{ marginTop: 6, textAlign: 'center' }}>
              Hikâyeleri konularına göre toplamak için bir liste oluştur.
            </Text>
          </View>
        ) : (
          lists.map(list => (
            <TouchableOpacity
              key={list.id}
              style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/profile/list/${list.id}` as any)}
              onLongPress={() => confirmDelete(list.id, list.name)}
            >
              <View style={[styles.listIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="bookmarks" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="subheading" numberOfLines={1} style={{ fontWeight: '700' }}>{list.name}</Text>
                <Text variant="caption" tone="textSecondary">
                  {list.storyIds.length} hikâye · {list.isPublic ? 'Herkese açık' : 'Gizli'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 6, width: 40, alignItems: 'center' },
  createRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.screenX, paddingTop: 12 },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  createBtn: { width: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  listIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
});

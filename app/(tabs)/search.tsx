import {
  Screen,
  Avatar,
  Badge,
  CategoryChip,
  SectionHeader,
  StoryRow,
  Text,
} from '@/components/ui';
import { CategoryMeta, Radius, Spacing, categoryColor, useTheme } from '@/constants/theme';
import { FollowButton } from '@/features/social/components/FollowButton';
import { useResponsiveGrid } from '@/hooks/useResponsive';
import { authActions, User } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { moderationActions } from '@/store/moderationStore';
import { preferencesActions } from '@/store/preferencesStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const GENRE_KEYS = [
  'romance', 'fantasy', 'sci_fi', 'mystery',
  'adventure', 'horror', 'comedy', 'drama', 'poetry',
] as const;

interface SearchHistoryItem {
  type: 'query' | 'story' | 'user';
  query?: string;
  id?: string;
  title?: string;
  name?: string;
  username?: string;
  image?: string;
  timestamp: number;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUserId = useAppSelector(s => s.auth.user?.id);
  const { numColumns, columnWidth } = useResponsiveGrid();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);

  // Trend Aramalar — gerçek kataloğdan, etkileşime (beğeni + yorum) göre
  // en popüler hikâye başlıkları. Mock veri yok.
  const trendingSearches = useMemo(
    () =>
      [...allStories]
        .sort(
          (a, b) =>
            (((b as any).likesCount || 0) + ((b as any).commentsCount || 0)) -
            (((a as any).likesCount || 0) + ((a as any).commentsCount || 0))
        )
        .map((s) => s.title)
        .filter(Boolean)
        .slice(0, 6),
    [allStories]
  );

  useEffect(() => {
    loadAllStories();
    loadRecentSearches();
    preferencesActions.load();
    if (currentUserId) moderationActions.loadBlockedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tercih/engel değişince listeyi tazele (reaktif)
  const matureOn = useAppSelector(s => s.preferences.showMatureContent);
  const blockedCount = useAppSelector(s => s.moderation.blockedUserIds.length);

  // Türetilmiş değer — eskiden useState+useEffect+setTimeout ile tutuluyordu.
  // Filtreleme senkron ve ucuz; render'da hesaplamak fazladan bir render
  // turu ve yapay 200ms gecikmeyi ortadan kaldırır.
  const filteredStories = useMemo(() => {
    // Engellenen yazarları ve (tercih kapalıysa) 18+ içeriği gizle
    let filtered = preferencesActions.filterMature(moderationActions.filterHidden(moderationActions.filterBlocked(allStories)));
    if (selectedGenre) filtered = filtered.filter(s => s.category === selectedGenre);
    if (searchQuery.trim()) {
      const t = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.title + (s.author?.displayName || '') + s.description).toLowerCase().includes(t) ||
        (s.tags?.some((tag: string) => tag.toLowerCase().includes(t)))
      );
    }
    return filtered;
  }, [allStories, selectedGenre, searchQuery, matureOn, blockedCount]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) searchUsersByQuery(searchQuery);
    else setSearchUsers([]);
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistoryV2');
      if (history) setRecentSearches(JSON.parse(history));
    } catch {}
  };

  const saveSearchToHistory = async (query: string) => {
    if (!query.trim()) return;
    try {
      const item: SearchHistoryItem = { type: 'query', query: query.trim(), timestamp: Date.now() };
      const next = [item, ...recentSearches.filter(i => !(i.type === 'query' && i.query === query.trim()))].slice(0, 10);
      setRecentSearches(next);
      await AsyncStorage.setItem('searchHistoryV2', JSON.stringify(next));
    } catch {}
  };

  const removeSearchItem = async (idx: number) => {
    try {
      const next = recentSearches.filter((_, i) => i !== idx);
      setRecentSearches(next);
      await AsyncStorage.setItem('searchHistoryV2', JSON.stringify(next));
    } catch {}
  };

  const clearSearchHistory = async () => {
    try { await AsyncStorage.removeItem('searchHistoryV2'); setRecentSearches([]); } catch {}
  };

  const searchUsersByQuery = async (query: string) => {
    if (query.trim().length < 2) { setSearchUsers([]); return; }
    try {
      setIsSearchingUsers(true);
      const users = await authActions.searchUsers(query);
      setSearchUsers(users);
    } catch { setSearchUsers([]); }
    finally { setIsSearchingUsers(false); }
  };

  const loadAllStories = async () => {
    try {
      setIsLoading(true);
      const firestore = await import('@react-native-firebase/firestore');
      const { collection, query, where, orderBy, limit, getDocs, getFirestore } = firestore;
      const db = getFirestore();
      // Sunucu tarafında yayınlananları filtrele — istemcide ayıklamaya gerek
      // kalmadan limit kadar gerçek sonuç döner.
      const q = query(
        collection(db, 'stories'),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const authorIds = Array.from(new Set(snapshot.docs.map(d => (d.data() as Story).authorId).filter(Boolean)));
      const authorEntries = await Promise.all(
        authorIds.map(async (uid) => {
          try { return [uid, await authActions.getUserById(uid)] as const; }
          catch { return [uid, null] as const; }
        })
      );
      const authorMap = new Map(authorEntries);
      const list: Story[] = snapshot.docs.map(doc => {
        const data = doc.data() as Story;
        const author = authorMap.get(data.authorId) || null;
        return { ...data, id: doc.id, author: author || { id: data.authorId || '', email: '', displayName: (data as any).authorName || 'Anonim', authProvider: 'email' } };
      });
      setAllStories(list);
    } catch {}
    finally { setIsLoading(false); }
  };

  const handleStoryPress = (story: Story) => {
    const item: SearchHistoryItem = { type: 'story', id: story.id, title: story.title, image: story.coverImage, timestamp: Date.now() };
    const next = [item, ...recentSearches.filter(i => !(i.type === 'story' && i.id === story.id))].slice(0, 10);
    setRecentSearches(next);
    AsyncStorage.setItem('searchHistoryV2', JSON.stringify(next)).catch(() => {});
    router.push(`/story/${story.id}/preview`);
  };

  const isEmpty = !isLoading && !isSearchingUsers && filteredStories.length === 0 && searchUsers.length === 0;
  const showIdle = !searchQuery.trim() && !selectedGenre;
  const busy = isLoading || isSearchingUsers;

  const listHeader = (
    <>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text variant="title" style={{ fontSize: 26, fontWeight: "700" }}>
          Keşfet
        </Text>
      </View>

      {/* Search input */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Hikaye, yazar ya da etiket ara"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => saveSearchToHistory(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Trend Aramalar — gerçek kataloğdan, sadece idle modda göster */}
      {showIdle && trendingSearches.length > 0 && (
        <View style={styles.section}>
          <Text
            variant="overline"
            tone="textLight"
            style={styles.overlineLabel}
          >
            TREND ARAMALAR
          </Text>
          <View style={styles.trendingRow}>
            {trendingSearches.map((title) => (
              <Pressable
                key={title}
                onPress={() => {
                  setSearchQuery(title);
                  saveSearchToHistory(title);
                }}
                style={[
                  styles.trendPill,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="trending-up" size={13} color={colors.bloom} />
                <Text variant="label" style={{ color: colors.text }}>
                  {title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Genre chips */}
      <View style={styles.sectionSpacing}>
        <SectionHeader title="Türler" accent={colors.primary} />
        <View style={styles.genreGrid}>
          {GENRE_KEYS.map((g) => (
            <CategoryChip
              key={g}
              category={g}
              active={selectedGenre === g}
              onPress={() => setSelectedGenre(selectedGenre === g ? null : g)}
            />
          ))}
        </View>
      </View>

      {/* Recent searches */}
      {showIdle && recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text variant="subheading" style={{ fontWeight: "700" }}>
              Son Aramalar
            </Text>
            <Pressable onPress={clearSearchHistory}>
              <Text variant="caption" tone="primary">
                Temizle
              </Text>
            </Pressable>
          </View>
          {recentSearches.map((item, idx) => (
            <View key={idx}>
              <Pressable
                style={styles.recentRow}
                onPress={() => {
                  if (item.type === "query") setSearchQuery(item.query || "");
                  else if (item.type === "story" && item.id)
                    router.push(`/story/${item.id}/preview`);
                  else if (item.type === "user" && item.id)
                    router.push(`/user/${item.id}` as any);
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {item.type === "query" && (
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                  )}
                  {item.type === "story" && (
                    <View
                      style={[
                        styles.recentThumb,
                        { backgroundColor: colors.surfaceVariant },
                      ]}
                    />
                  )}
                  {item.type === "user" && (
                    <Avatar size={36} name={item.name} />
                  )}
                  <View>
                    <Text variant="body">
                      {item.type === "query"
                        ? item.query
                        : item.title || item.name}
                    </Text>
                    {item.type !== "query" && (
                      <Text variant="caption" tone="textSecondary">
                        {item.type === "story" ? "Hikaye" : `@${item.username}`}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable onPress={() => removeSearchItem(idx)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={colors.textLight} />
                </Pressable>
              </Pressable>
              {idx < recentSearches.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.border, marginLeft: 46 },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Results section */}
      {(!showIdle || selectedGenre !== null) && (
        <View style={styles.sectionSpacing}>
          <View style={styles.rowBetween}>
            <Text variant="heading" style={{ fontSize: 18, fontWeight: "700" }}>
              {selectedGenre
                ? (CategoryMeta[selectedGenre]?.label ?? selectedGenre)
                : searchQuery
                  ? `"${searchQuery}"`
                  : "Tüm Sonuçlar"}
            </Text>
            <Badge label={`${filteredStories.length} hikâye`} tone="neutral" />
          </View>
        </View>
      )}

      {/* Users — searchUsers zaten authStore.searchUsers içinde .slice(0, 20) ile sınırlı */}
      {searchUsers.length > 0 && (
        <View
          style={[
            { gap: 0, marginBottom: Spacing.lg },
          ]}
        >
          {searchUsers.map((user, idx) => (
            <View key={user.id}>
              <Pressable
                style={styles.userRow}
                onPress={() => router.push(`/user/${user.id}` as any)}
              >
                <Avatar
                  uri={user.profileImage}
                  name={user.displayName}
                  size={50}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="subheading" numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text variant="caption" tone="primary">
                    @{user.username || "user"}
                  </Text>
                </View>
                <FollowButton userId={user.id} />
              </Pressable>
              {idx < searchUsers.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.border, marginLeft: 62 },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {busy && (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginVertical: 32 }}
        />
      )}
    </>
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        key={`grid-${numColumns}`}
        data={busy ? [] : filteredStories}
        keyExtractor={(story) => story.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: Spacing.gutter, paddingHorizontal: Spacing.screenX } : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !busy && isEmpty && (searchQuery.trim() || selectedGenre) ? (
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={38} color={colors.primaryLight} />
              <Text variant="body" tone="textSecondary" style={{ marginTop: 12, fontStyle: 'italic', textAlign: 'center' }}>
                Bu bahçede henüz hiçbir şey filizlenmedi.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: story }) => (
          <View
            style={
              numColumns > 1
                ? { width: columnWidth, marginBottom: Spacing.md }
                : { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.md }
            }
          >
            <StoryRow
              story={story}
              status={story.isCompleted ? 'Tamamlandı' : null}
              onPress={() => handleStoryPress(story)}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.screenX,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },
  section: {
    paddingHorizontal: Spacing.screenX,
    marginBottom: Spacing.lg,
    gap: 10,
  },
  sectionSpacing: {
    marginBottom: Spacing.lg,
  },
  overlineLabel: {
    fontSize: 11, lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 8,
  },
  trendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing.screenX,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentThumb: {
    width: 36,
    height: 50,
    borderRadius: Radius.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: Spacing.screenX,
  },
  followPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
});

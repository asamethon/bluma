import OfflineIndicator from '@/components/OfflineIndicator';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { buildStoryShareUrl } from '@/utils/deepLinks';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { store } from '@/store';

export default function StoryInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedChapter, setSavedChapter] = useState<number | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await storyActions.getStoryWithOfflineFallback(id);
        setStory(data);
        // Real-time updates
        const unsub = storyActions.setupStoryDetailListener(id);
        unsubscribe = unsub;
        // Check saved
        const saved = await storyActions.isStorySaved(id);
        setIsSaved(saved);
        // Load reading progress
        try {
          const raw = await AsyncStorage.getItem(`readingProgress_${id}`);
          if (raw) {
            const { chapterIndex } = JSON.parse(raw);
            if (typeof chapterIndex === 'number' && chapterIndex > 0) {
              setSavedChapter(chapterIndex);
            }
          }
        } catch {}
      } catch (e) {
        console.error('Load story info error', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const handleToggleSave = async () => {
    const { user } = store.getState().auth;
    if (!user?.id) {
      Alert.alert('Giriş Gerekli', 'Kütüphaneye eklemek için giriş yapmalısın.');
      return;
    }
    if (!story) return;
    const res = await storyActions.saveStory(story.id);
    if (res.success) setIsSaved(prev => !prev);
  };

  const handleShare = async () => {
    try {
      const url = buildStoryShareUrl(String(id));
      await Share.share({
        title: story?.title || 'Bluma Hikaye',
        message: story?.title ? `"${story.title}" hikayesini Bluma'da oku:\n${url}` : url,
      });
    } catch (e) {
      console.error('Share error', e);
    }
  };

  const handleStartReading = (chapterIndex?: number) => {
    if (!story) return;
    storyActions.incrementStoryViews(story.id);
    const url = chapterIndex && chapterIndex > 0
      ? `/story/${story.id}?chapter=${chapterIndex}`
      : `/story/${story.id}`;
    router.push(url as any);
  };

  // Helpers for chapter list rendering
  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num < 1000) return `${num}`;
    if (num < 1000000) {
      const k = num / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    const m = num / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  };
  const formatDate = (d: Date): string => d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  type ChapterListItem = { id: string; title: string };
  const getChapters = (): ChapterListItem[] => {
    if (!story) return [];
    const hasTitles = !!(story.chapterTitles && story.chapterTitles.length > 0);
    const titles = hasTitles
      ? story.chapterTitles!
      : Array.from({ length: Math.max(1, story.chaptersCount || 1) }).map((_, i) => `${i + 1}. Bölüm`);
    // Bölüm başına gerçek (yorum/beğeni/okunma) veri modeli olmadığından,
    // satır başına yalnızca başlık gösteriyoruz — uydurma istatistik üretmiyoruz.
    return titles.map((t, idx) => ({
      id: `${idx + 1}`,
      title: hasTitles ? `${idx + 1}. Bölüm – ${t}` : `${idx + 1}. Bölüm`,
    }));
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <OfflineIndicator showWhenOnline={true} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          {story?.coverImage ? (
            <Image source={{ uri: story.coverImage }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
          <View style={styles.heroMeta}>
            <Text style={styles.title}>{story?.title || 'Hikaye'}</Text>
            <TouchableOpacity onPress={() => story?.authorId && router.push(`/user/${story.authorId}`)}>
              <Text style={styles.author}>@{story?.author?.username || 'yazar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleToggleSave}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.primary} />
            <Text style={styles.primaryActionText}>{isSaved ? 'Kütüphanede' : 'Kütüphaneye Ekle'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        {story?.description ? (
          <View style={styles.card}> 
            <Text style={styles.description}>{story.description}</Text>
          </View>
        ) : null}

        {/* Chapters */}
        <View style={styles.sectionHeader}> 
          <Text style={styles.sectionTitle}>Bölümler</Text>
          {/* Son güncelleme gösterimi basitçe updatedAt alanından */}
          {story?.updatedAt && (
            <Text style={styles.sectionSub}>
              Son güncelleme: {new Date((story.updatedAt as any)?.toDate ? (story.updatedAt as any).toDate() : story.updatedAt).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
        <View style={styles.card}>
          {getChapters().map((ch, idx) => (
            <TouchableOpacity key={ch.id} style={styles.chapterRow} onPress={() => handleStartReading(idx)} activeOpacity={0.8}>
              <View style={styles.chapterLeft}>
                <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.chapterTitle}>{ch.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue reading button (if progress exists) */}
        {savedChapter !== null && (
          <TouchableOpacity style={[styles.readButton, styles.continueButton]} onPress={() => handleStartReading(savedChapter)}>
            <Ionicons name="play-circle-outline" size={18} color={colors.surface} />
            <Text style={styles.readButtonText}>
              Kaldığın yerden devam et · Bölüm {savedChapter + 1}
            </Text>
          </TouchableOpacity>
        )}

        {/* Start reading button */}
        <TouchableOpacity style={styles.readButton} onPress={() => handleStartReading(0)}>
          <Ionicons name="book-outline" size={18} color={colors.surface} />
          <Text style={styles.readButtonText}>Baştan Oku</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBar: {
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 4,
    },
    headerIcon: {
      padding: 6,
      alignSelf: 'flex-start',
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 16,
    },
    cover: {
      width: 72,
      height: 96,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    coverPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroMeta: { flex: 1 },
    title: {
      fontSize: 22, lineHeight: 29,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    author: {
      fontSize: 14, lineHeight: 18,
      color: colors.primary,
      fontWeight: '600',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    primaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryActionText: {
      color: colors.primary,
      fontWeight: '700',
    },
    iconAction: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    card: {
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },
    description: {
      color: colors.text,
      lineHeight: 22,
      fontSize: 14,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '800',
      color: colors.text,
    },
    sectionSub: {
      fontSize: 12, lineHeight: 16,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    chapterRow: {
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chapterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    chapterRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    chStats: { flexDirection: 'row', alignItems: 'center' },
    chEnd: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
    chStatText: { color: colors.textSecondary, fontWeight: '600', marginLeft: 4 },
    chDate: { color: colors.textSecondary, fontWeight: '600' },
    chapterTitle: {
      color: colors.text,
      fontSize: 14, lineHeight: 18,
      fontWeight: '600',
    },
    readButton: {
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 12,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    continueButton: {
      backgroundColor: colors.bloom,
      marginBottom: 8,
    },
    readButtonText: {
      color: colors.surface,
      fontWeight: '800',
    },
  });



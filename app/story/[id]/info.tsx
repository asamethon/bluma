import OfflineIndicator from '@/components/OfflineIndicator';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { buildStoryShareUrl } from '@/utils/deepLinks';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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
import { ShareStorySheet } from '@/features/messaging/components/ShareStorySheet';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '@/utils/logger';

export default function StoryInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [story, setStory] = useState<Story | null>(null);
  const [, setIsLoading] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedChapter, setSavedChapter] = useState<number | null>(null);
  const [shareVisible, setShareVisible] = useState<boolean>(false);
  // Gizli hesabın hikâyesi doğrudan bağlantıyla da açılamaz.
  const authorAccess = useProfileAccess(story?.author);

  const isDownloaded = useAppSelector(s => s.story.offlineStories.some(o => o.id === id));
  const downloadProgress = useAppSelector(s => s.story.isDownloading[String(id)]);
  const isDownloading = downloadProgress !== undefined;

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await storyActions.getStoryWithOfflineFallback(id);
        setStory(data);
        const unsub = storyActions.setupStoryDetailListener(id);
        unsubscribe = unsub;
        const saved = await storyActions.isStorySaved(id);
        setIsSaved(saved);
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
        logger.error('Load story info error', e);
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
      Alert.alert(t('studio.loginRequiredTitle'), t('storyScreen.saveLoginRequired'));
      return;
    }
    if (!story) return;
    const res = await storyActions.saveStory(story.id);
    if (res.success) setIsSaved(prev => !prev);
  };

  const handleShareLink = async () => {
    try {
      const url = buildStoryShareUrl(String(id));
      await Share.share({
        title: story?.title || 'Bluma',
        message: story?.title ? t('storyScreen.shareMessage', { title: story.title, url }) : url,
      });
    } catch (e) {
      logger.error('Share error', e);
    }
  };

  const handleToggleDownload = async () => {
    if (!story || isDownloading) return;
    if (isDownloaded) {
      Alert.alert(
        t('storyScreen.removeOfflineTitle'),
        t('storyScreen.removeOfflineConfirm', { title: story.title }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('lists.remove'), style: 'destructive', onPress: () => storyActions.deleteOfflineStory(story.id) },
        ]
      );
      return;
    }
    const res = await storyActions.downloadStoryOffline(story);
    if (!res.success) {
      Alert.alert(t('storyScreen.downloadFailedTitle'), res.error || t('storyScreen.downloadFailedMessage'));
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

  type ChapterListItem = { id: string; title: string };
  const getChapters = (): ChapterListItem[] => {
    if (!story) return [];
    const hasTitles = !!(story.chapterTitles && story.chapterTitles.length > 0);
    const titles = hasTitles
      ? story.chapterTitles!
      : Array.from({ length: Math.max(1, story.chaptersCount || 1) }).map((_, i) => t('story.chapterN', { number: i + 1 }));
    return titles.map((chTitle, idx) => ({
      id: `${idx + 1}`,
      title: hasTitles
        ? `${t('story.chapterN', { number: idx + 1 })} – ${chTitle}`
        : t('story.chapterN', { number: idx + 1 }),
    }));
  };

  if (authorAccess.locked || authorAccess.checking) {
    return (
      <Screen style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
        {authorAccess.locked && (
          <View style={{ marginTop: 40 }}>
            <PrivateProfileNotice name={story?.author?.displayName?.split(' ')[0]} />
          </View>
        )}
      </Screen>
    );
  }

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

        <View style={styles.hero}>
          {story?.coverImage ? (
            <Image source={{ uri: story.coverImage }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
          )}
          <View style={styles.heroMeta}>
            <Text style={styles.title}>{story?.title || t('common.story')}</Text>
            <TouchableOpacity onPress={() => story?.authorId && router.push(`/user/${story.authorId}`)}>
              <Text style={styles.author}>@{story?.author?.username || 'yazar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleToggleSave}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.primary} />
            <Text style={styles.primaryActionText}>{isSaved ? t('storyScreen.inLibrary') : t('storyScreen.addToLibrary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconAction}
            onPress={handleToggleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={isDownloaded ? 'checkmark-circle' : 'download-outline'}
                size={18}
                color={isDownloaded ? colors.primary : colors.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} onPress={() => setShareVisible(true)}>
            <Ionicons name="share-social-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {story?.description ? (
          <View style={styles.card}> 
            <Text style={styles.description}>{story.description}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}> 
          <Text style={styles.sectionTitle}>{t('studio.chapters')}</Text>
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

        {savedChapter !== null && (
          <TouchableOpacity style={[styles.readButton, styles.continueButton]} onPress={() => handleStartReading(savedChapter)}>
            <Ionicons name="play-circle-outline" size={18} color={colors.surface} />
            <Text style={styles.readButtonText}>
              Kaldığın yerden devam et · Bölüm {savedChapter + 1}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.readButton} onPress={() => handleStartReading(0)}>
          <Ionicons name="book-outline" size={18} color={colors.surface} />
          <Text style={styles.readButtonText}>{t('storyScreen.readFromStart')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ShareStorySheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        onShareLink={handleShareLink}
        safeBottom={insets.bottom}
        story={
          story
            ? {
                id: String(id),
                title: story.title,
                coverImage: story.coverImage,
                authorName: story.author?.displayName || story.author?.username,
              }
            : null
        }
      />
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


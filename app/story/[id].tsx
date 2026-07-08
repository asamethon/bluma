import AddToListSheet from '@/components/AddToListSheet';
import ReportSheet from '@/components/ReportSheet';
import {
  Avatar, BloomMark, Button, GenreTag, IconButton, Text } from '@/components/ui';
import { ContentMaxWidth, Spacing, categoryColor, useTheme } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { buildStoryShareUrl } from '@/utils/deepLinks';
import { useGuestGate } from '@/contexts/GuestContext';
import { useFollow } from '@/features/social/hooks/useFollow';
import { StoryImage } from '@/features/story/components/StoryImage';
import { parseImageToken, stripImageTokens } from '@/features/story/utils/imageToken';
import { renderInlineFormatting } from '@/features/story/utils/richText';
import { challengeActions } from '@/store/challengeStore';
import { moderationActions } from '@/store/moderationStore';
import { storyActions } from '@/store/storyStore';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { preferencesActions, getReadingPalette, READING_LINE_HEIGHT_MULTIPLIER } from '@/store/preferencesStore';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function fmt(n?: number) {
  const v = n || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}b` : `${v}`;
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ReaderScreen() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  const router = useRouter();
  const { colors, fonts, scheme } = useTheme();
  const { width: windowWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isGuest } = useAppSelector(s => s.auth);
  const { requireAuth, startAuth } = useGuestGate();
  const { currentStory, likedStories, savedStories } = useAppSelector(s => s.story);
  const { readingTheme, readingFont, readingLineSpacing } = useAppSelector(s => s.preferences);

  // Okuma teması, uygulamanın genel (sistem) temasından bağımsız bir tercih —
  // 'light' seçiliyken `null` döner ve normal `colors` kullanılmaya devam eder.
  const readingPalette = getReadingPalette(readingTheme);
  const rc = readingPalette || colors;
  const readingFontFamily = readingFont === 'sans' ? fonts.sansRegular : fonts.serif;
  const lineHeightMultiplier = READING_LINE_HEIGHT_MULTIPLIER[readingLineSpacing];

  const [story, setStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialChapter = chapter ? Math.max(0, parseInt(chapter as string) || 0) : 0;
  // Misafirler yalnızca 1. bölümün önizlemesini görebilir; ?chapter=1 ile
  // kapıyı atlamalarını engellemek için indeks 0'a sabitlenir.
  const [currentChapterIndex, setCurrentChapterIndex] = useState(isGuest ? 0 : initialChapter);
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [listSheetVisible, setListSheetVisible] = useState(false);

  // Chrome visibility — animated
  const chromeAnim = useRef(new Animated.Value(1)).current;
  const bodyTopAnim = useRef(new Animated.Value(0)).current;
  const [chromeVisible, setChromeVisible] = useState(true);
  const scrollRef = useRef<any>(null);
  const lastScrollSaveRef = useRef(0);
  const pendingScrollRatioRef = useRef<number | null>(null);

  // Bölüm içi scroll konumunu oran olarak kaydet (throttled — her scroll
  // frame'inde değil, en fazla 2 saniyede bir).
  const handleScroll = (e: any) => {
    if (isGuest || !id) return;
    const now = Date.now();
    if (now - lastScrollSaveRef.current < 2000) return;
    lastScrollSaveRef.current = now;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    const ratio = scrollable > 0 ? Math.max(0, Math.min(1, contentOffset.y / scrollable)) : 0;
    readingProgressActions.saveReadingProgress(String(id), currentChapterIndex, ratio);
  };

  const toggleChrome = () => {
    const next = !chromeVisible;
    setChromeVisible(next);
    Animated.parallel([
      Animated.timing(chromeAnim, {
        toValue: next ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(bodyTopAnim, {
        toValue: next ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    if (id) {
      loadStory();
      storyActions.setupStoryDetailListener(id);
      // Asıl okuma görüntülenmeyi saymalı (bilgi ekranı tek kaynak olmamalı).
      // Store, kullanıcı başına 3 görüntülenme ile sınırlar; misafirleri saymaz.
      storyActions.incrementStoryViews(id);
      logEvent(getAnalytics(), 'story_read', { story_id: String(id) }).catch(() => {});
    }
  }, [id]);

  // Bölüm bazlı okuma olayı — retention funnel'ı için (bkz. YAPILACAKLAR 3.2).
  useEffect(() => {
    if (!id) return;
    logEvent(getAnalytics(), 'chapter_read', {
      story_id: String(id),
      chapter_index: currentChapterIndex,
    }).catch(() => {});
  }, [id, currentChapterIndex]);

  // Bölüm-bazlı depolamaya geçmiş hikâyelerde (bkz. YAPILACAKLAR 2.2) her
  // bölüm tek doküman okumasıyla çekilir — komşu bölümler arka planda
  // prefetch edilir ki "sonraki bölüm"e geçişte bekleme olmasın.
  const chapterCacheRef = useRef<Map<number, string>>(new Map());
  const [chapterBody, setChapterBody] = useState<string | null>(null);
  useEffect(() => { chapterCacheRef.current.clear(); }, [id]);
  useEffect(() => {
    if (!story?.chaptersInSubcollection || !id) return;
    let alive = true;
    const cached = chapterCacheRef.current.get(currentChapterIndex);
    if (cached != null) {
      setChapterBody(cached);
    } else {
      setChapterBody(null);
      storyActions.getChapter(String(id), currentChapterIndex).then((ch: any) => {
        if (!alive) return;
        const body = ch?.content || '';
        chapterCacheRef.current.set(currentChapterIndex, body);
        setChapterBody(body);
      });
    }
    [currentChapterIndex - 1, currentChapterIndex + 1].forEach(i => {
      if (i < 0 || chapterCacheRef.current.has(i)) return;
      storyActions.getChapter(String(id), i).then((ch: any) => {
        if (ch) chapterCacheRef.current.set(i, ch.content || '');
      });
    });
    return () => { alive = false; };
  }, [id, story?.chaptersInSubcollection, currentChapterIndex]);

  // Bölüm-bazlı beğeni (bkz. YAPILACAKLAR 2.3) — hikâye toplamından ayrı,
  // "Bölüm sonu" ayracında gösterilir. Yalnızca yeni veri modeline geçmiş
  // (chaptersInSubcollection) hikâyelerde ve oturum açmış kullanıcıda anlamlı.
  const [chapterLikeState, setChapterLikeState] = useState<{ liked: boolean; count: number } | null>(null);
  useEffect(() => {
    if (!story?.chaptersInSubcollection || !id || isGuest) { setChapterLikeState(null); return; }
    let alive = true;
    Promise.all([
      storyActions.getChapter(String(id), currentChapterIndex),
      storyActions.isChapterLiked(String(id), currentChapterIndex),
    ]).then(([ch, liked]: any) => {
      if (!alive) return;
      setChapterLikeState({ liked, count: ch?.likesCount || 0 });
    });
    return () => { alive = false; };
  }, [id, story?.chaptersInSubcollection, currentChapterIndex, isGuest]);

  const handleToggleChapterLike = () => {
    if (!requireAuth('like') || !chapterLikeState || !id) return;
    const wasLiked = chapterLikeState.liked;
    // Optimistic
    setChapterLikeState({ liked: !wasLiked, count: Math.max(0, chapterLikeState.count + (wasLiked ? -1 : 1)) });
    storyActions.toggleChapterLike(String(id), currentChapterIndex, wasLiked).then((r: any) => {
      if (!r.success) {
        // Geri al
        setChapterLikeState({ liked: wasLiked, count: chapterLikeState.count });
      }
    });
  };

  // Save reading progress whenever chapter changes. updatedAt, ana sayfadaki
  // "Okumaya devam et" rafının sıralaması için ve ikinci cihazda kaldığın
  // yerden devam edebilmek için kullanılır (bkz. YAPILACAKLAR 2.1).
  useEffect(() => {
    if (!id || isGuest) return;
    readingProgressActions.saveReadingProgress(String(id), currentChapterIndex, 0);
  }, [currentChapterIndex, id, isGuest]);

  // Resume from saved progress — only when the caller didn't request a specific
  // chapter (e.g. opened from the feed/search) and the user is signed in.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    if (chapter || isGuest || !id || !story) return;
    resumedRef.current = true;
    readingProgressActions.getReadingProgress(String(id))
      .then(saved => {
        const idx = saved?.chapterIndex;
        if (typeof idx === 'number' && idx > 0) {
          const max = (story.chapterTitles?.length || story.chaptersCount || 1) - 1;
          setCurrentChapterIndex(Math.max(0, Math.min(idx, max)));
        }
        if (saved?.scrollRatio) {
          pendingScrollRatioRef.current = saved.scrollRatio;
        }
      })
      .catch(() => {});
  }, [story, chapter, isGuest, id]);

  useEffect(() => {
    if (currentStory && currentStory.id === id) setStory(currentStory);
  }, [currentStory, id]);

  // Yazar takibi — optimistic mantık features/social/useFollow'da
  const follow = useFollow(story?.authorId);
  const handleToggleFollow = () => {
    if (!requireAuth('follow')) return;
    follow.toggle();
  };

  const loadStory = async () => {
    try {
      setIsLoading(true);
      const data = await storyActions.getStoryById(id);
      if (data) setStory(data);
    } catch {}
    finally { setIsLoading(false); }
  };

  const isLiked = () => likedStories.some(s => s.id === id);
  const isSaved = () => savedStories.some(s => s.id === id);

  const handleLike = async () => {
    if (!requireAuth('like')) return;
    await storyActions.likeStory(id);
  };

  const handleSave = async () => {
    if (!requireAuth('save')) return;
    await storyActions.saveStory(id);
  };

  const handleShare = async () => {
    try {
      const url = buildStoryShareUrl(String(id));
      await Share.share({
        title: story?.title,
        message: story?.title ? `"${story.title}" hikayesini Bluma'da oku:\n${url}` : url,
      });
    } catch {}
  };

  const handleReport = () => {
    setShowMenu(false);
    if (!requireAuth('default')) return;
    setReportVisible(true);
  };

  const handleBlockAuthor = () => {
    setShowMenu(false);
    if (!story?.authorId) return;
    if (!requireAuth('default')) return;
    Alert.alert(
      'Yazarı engelle',
      `${story.author?.displayName || 'Bu yazar'} engellensin mi? Hikâyeleri ve yorumları sana gösterilmez.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            const r = await moderationActions.blockUser(story.authorId);
            if (r.success) {
              Alert.alert('Engellendi', 'Bu yazar artık sana gösterilmeyecek.');
              router.back();
            } else {
              Alert.alert('Hata', r.error || 'Engelleme başarısız.');
            }
          },
        },
      ]
    );
  };

  const CHAPTER_SEP = '\n§§\n';

  const splitChapters = (content: string, expectedCount?: number): string[] => {
    const clean = stripHtml(content || '');
    if (!clean.trim()) return [];

    // Yeni format: benzersiz ayırıcı
    if (clean.includes(CHAPTER_SEP)) {
      return clean.split(CHAPTER_SEP).filter((c: string) => c.trim().length > 0);
    }

    // Eski format: \n\n ile birleştirilmiş paragraflar
    const n = expectedCount && expectedCount > 1 ? expectedCount : 1;
    const paras = clean.split('\n\n').filter((p: string) => p.trim().length > 0);
    if (paras.length === 0) return [clean];
    if (n <= 1 || paras.length <= n) {
      // Paragraf sayısı ≤ bölüm sayısı: her paragraf bir bölüm ya da hepsi tek
      return n <= 1 ? [paras.join('\n\n')] : paras;
    }

    // Paragrafları n eşit gruba dağıt
    const perChap = Math.ceil(paras.length / n);
    const result: string[] = [];
    for (let i = 0; i < n; i++) {
      const chunk = paras.slice(i * perChap, (i + 1) * perChap);
      if (chunk.length) result.push(chunk.join('\n\n'));
    }
    return result.filter((c: string) => c.trim().length > 0);
  };

  const goNext = () => {
    // Misafir bir sonraki bölüme geçemez — auth kapısını aç.
    if (isGuest) { requireAuth('read'); return; }
    const chapterCount = story?.chapterTitles?.length || story?.chaptersCount || 1;
    if (currentChapterIndex < chapterCount - 1) {
      setCurrentChapterIndex(i => i + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (currentUser?.id) challengeActions.trackAction(currentUser.id, 'chaptersRead');
    }
  };

  const goPrev = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(i => i - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const chromeHeight = insets.top + 56;
  const bodyTopExpanded = chromeHeight + 20;
  const bodyTopCollapsed = insets.top + 16;

  // bodyTopAnim: 1 = chrome görünür, 0 = gizli
  useEffect(() => { bodyTopAnim.setValue(1); }, []);

  const interpolatedBodyTop = bodyTopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [bodyTopCollapsed, bodyTopExpanded],
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }}>
        <Text variant="body" tone="textSecondary">Hikaye yükleniyor…</Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }}>
        <Text variant="body" tone="textSecondary">Hikaye bulunamadı</Text>
        <Button label="Geri Dön" variant="ghost" size="sm" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  // Şikâyet üzerine admin tarafından gizlenmiş içerik — yazarı dışında
  // kimse göremez (bkz. YAPILACAKLAR 2.7).
  if (story.isHidden && story.authorId !== currentUser?.id) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top, paddingHorizontal: 32 }}>
        <Ionicons name="eye-off-outline" size={40} color={colors.textSecondary} />
        <Text variant="body" tone="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
          Bu hikâye moderasyon nedeniyle kaldırıldı.
        </Text>
        <Button label="Geri Dön" variant="ghost" size="sm" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  // Bölüm-bazlı depolamaya geçmiş hikâyelerde (chaptersInSubcollection) içerik
  // yukarıdaki effect'in çektiği `chapterBody`'den gelir — tek doküman okuması,
  // sorgu değil. Eski hikâyelerde legacy `content` alanı burada yerinde bölünür.
  // Bölüm sayısı için en güvenilir kaynak chapterTitles uzunluğudur; yoksa
  // chaptersCount'a düşülür.
  const legacyChapters = story.chaptersInSubcollection
    ? []
    : splitChapters(story.content || '', story.chapterTitles?.length || story.chaptersCount);
  const totalChapters = story.chaptersInSubcollection
    ? (story.chapterTitles?.length || story.chaptersCount || 1)
    : (legacyChapters.length || 1);
  const currentContent = story.chaptersInSubcollection
    ? (chapterBody ?? '')
    : (legacyChapters[currentChapterIndex] || story.content || '');
  const chapterTitle = story.chapterTitles?.[currentChapterIndex]
    ? `Bölüm ${currentChapterIndex + 1} — ${story.chapterTitles[currentChapterIndex]}`
    : `Bölüm ${currentChapterIndex + 1}`;
  const readingTime = Math.max(1, Math.ceil((stripImageTokens(currentContent || '').split(/\s+/).length || 0) / 200));
  const accentColor = categoryColor(story.category, colors.primary);

  // Split current chapter into display paragraphs
  const PREVIEW_PARAS = 2;
  const allParas = currentContent.split('\n\n').filter((p: string) => p.trim().length > 0);
  const gated = isGuest;
  const currentParas = gated ? allParas.slice(0, PREVIEW_PARAS) : allParas;
  // Damla harf (drop cap) yalnızca ilk METİN paragrafına uygulanır —
  // paragraf bir [[img:URL]] belirteciyse resim olarak render edilir.
  const firstTextIndex = currentParas.findIndex((p: string) => !parseImageToken(p));

  const isDarkReadingBg = readingTheme === 'dark' || readingTheme === 'black' || (readingTheme === 'light' && scheme === 'dark');

  return (
    <View style={{ flex: 1, backgroundColor: rc.background }}>
      <StatusBar
        barStyle={isDarkReadingBg ? "light-content" : "dark-content"}
      />

      {/* ── Top chrome ──────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.topChrome,
          {
            paddingTop: insets.top,
            backgroundColor: rc.background + "E0",
            borderBottomColor: rc.border,
            opacity: chromeAnim,
            transform: [
              {
                translateY: chromeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-chromeHeight, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={chromeVisible ? "auto" : "none"}
      >
        <IconButton
          icon="chevron-back"
          size={40}
          color={rc.text}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            variant="subheading"
            numberOfLines={1}
            style={{ fontWeight: "700", fontSize: 15, color: rc.text }}
          >
            {story.title}
          </Text>
          <Text variant="caption" color={rc.textSecondary}>
            {gated
              ? "Önizleme · Bölüm 1"
              : `${chapterTitle} · ${readingTime} dk`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSettings((s) => !s)}
          style={styles.chromeBtn}
        >
          <Ionicons name="text" size={20} color={rc.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.chromeBtn}>
          <Ionicons
            name={isSaved() ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved() ? colors.secondary : rc.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={styles.chromeBtn}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={rc.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Reading settings panel — tema/font/aralık, useTheme'den bağımsız
          okuyucuya özel tercihler (preferencesSlice'da kalıcı). */}
      {showSettings && (
        <View
          style={[
            styles.settingsPanel,
            {
              top: chromeHeight + 4,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.settingsRow}>
            <Text variant="caption" tone="textSecondary" style={{ width: 78 }}>
              Yazı Boyutu
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <TouchableOpacity
                onPress={() => setFontSize((f) => Math.max(14, f - 2))}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <Text
                variant="label"
                style={{ minWidth: 22, textAlign: "center" }}
              >
                {fontSize}
              </Text>
              <TouchableOpacity
                onPress={() => setFontSize((f) => Math.min(24, f + 2))}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsRow}>
            <Text variant="caption" tone="textSecondary" style={{ width: 78 }}>
              Tema
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(
                [
                  { key: "light", swatch: colors.background },
                  { key: "sepia", swatch: "#F4ECD8" },
                  { key: "dark", swatch: "#1C1C1E" },
                  { key: "black", swatch: "#000000" },
                ] as const
              ).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => preferencesActions.setReadingTheme(t.key)}
                  style={[
                    styles.themeSwatch,
                    {
                      backgroundColor: t.swatch,
                      borderColor:
                        readingTheme === t.key ? colors.primary : colors.border,
                      borderWidth: readingTheme === t.key ? 2 : 1,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.settingsRow}>
            <Text variant="caption" tone="textSecondary" style={{ width: 78 }}>
              Yazı Tipi
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(
                [
                  { key: "serif", label: "Serif" },
                  { key: "sans", label: "Sans" },
                ] as const
              ).map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => preferencesActions.setReadingFont(f.key)}
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor:
                        readingFont === f.key
                          ? colors.primarySoft
                          : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    color={
                      readingFont === f.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingsRow}>
            <Text variant="caption" tone="textSecondary" style={{ width: 78 }}>
              Satır Aralığı
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(
                [
                  { key: "compact", label: "Sık" },
                  { key: "normal", label: "Normal" },
                  { key: "relaxed", label: "Geniş" },
                ] as const
              ).map((l) => (
                <TouchableOpacity
                  key={l.key}
                  onPress={() =>
                    preferencesActions.setReadingLineSpacing(l.key)
                  }
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor:
                        readingLineSpacing === l.key
                          ? colors.primarySoft
                          : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    color={
                      readingLineSpacing === l.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  >
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Reading body ────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          windowWidth > ContentMaxWidth.content
            ? [styles.body, { maxWidth: ContentMaxWidth.content, alignSelf: 'center', width: '100%' }]
            : styles.body
        }
        onScroll={handleScroll}
        scrollEventThrottle={500}
        onContentSizeChange={(_w, h) => {
          const ratio = pendingScrollRatioRef.current;
          if (ratio == null) return;
          pendingScrollRatioRef.current = null;
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ y: h * ratio, animated: false });
          });
        }}
      >
        <Animated.View style={{ paddingTop: interpolatedBodyTop }}>
          <Pressable onPress={toggleChrome}>
            {/* Genre tag + olgun içerik rozeti */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <GenreTag category={story.category} />
              {story.targetAudience === "adult" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    backgroundColor: colors.error + "1A",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                  }}
                >
                  <Ionicons name="warning" size={11} color={colors.error} />
                  <Text
                    style={{
                      fontSize: 11, lineHeight: 14,
                      fontWeight: "700",
                      color: colors.error,
                    }}
                  >
                    18+
                  </Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text
              variant="title"
              style={{
                fontSize: 30,
                lineHeight: 40,
                fontWeight: "700",
                letterSpacing: -0.3,
                marginTop: 12,
                marginBottom: 14,
                color: rc.text,
              }}
            >
              {story.title}
            </Text>

            {/* Author row */}
            <View style={[styles.authorRow, { borderBottomColor: rc.border }]}>
              <Avatar
                uri={story.author?.profileImage}
                name={story.author?.displayName || story.author?.email}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text
                  variant="subheading"
                  style={{ fontWeight: "700", color: rc.text }}
                >
                  {story.author?.displayName || "Yazar"}
                </Text>
                <Text variant="caption" color={rc.textSecondary}>
                  @
                  {story.author?.username ||
                    story.author?.email?.split("@")[0] ||
                    "yazar"}
                </Text>
              </View>
              {!follow.isSelf && (
                <Button
                  label={follow.isFollowing ? "Takip Ediliyor" : "Takip Et"}
                  variant={follow.isFollowing ? "ghost" : "outline"}
                  size="sm"
                  onPress={handleToggleFollow}
                />
              )}
            </View>

            {/* Chapter nav pill (çok bölümlü) */}
            {totalChapters > 1 && (
              <View
                style={[styles.chapterPill, { backgroundColor: rc.surface }]}
              >
                <TouchableOpacity
                  onPress={goPrev}
                  disabled={currentChapterIndex === 0}
                  style={{ opacity: currentChapterIndex === 0 ? 0.3 : 1 }}
                >
                  <Ionicons name="chevron-back" size={18} color={rc.text} />
                </TouchableOpacity>
                <Text
                  variant="label"
                  style={{ fontWeight: "700", color: rc.text }}
                >
                  {chapterTitle}
                </Text>
                <TouchableOpacity
                  onPress={goNext}
                  disabled={currentChapterIndex === totalChapters - 1}
                  style={{
                    opacity:
                      currentChapterIndex === totalChapters - 1 ? 0.3 : 1,
                  }}
                >
                  <Ionicons name="chevron-forward" size={18} color={rc.text} />
                </TouchableOpacity>
              </View>
            )}

            {/* Content — first text paragraph with drop cap, inline images rendered as images */}
            {currentContent ? (
              <View style={{ marginTop: 8 }}>
                {currentParas.map((para: string, i: number) => {
                  const imageUrl = parseImageToken(para);
                  if (imageUrl) {
                    return <StoryImage key={i} uri={imageUrl} />;
                  }
                  if (i === firstTextIndex) {
                    return (
                      <View key={i} style={styles.dropCapRow}>
                        <Text
                          style={[
                            styles.dropCap,
                            { color: accentColor, fontFamily: fonts.serif },
                          ]}
                        >
                          {para.charAt(0)}
                        </Text>
                        <Text
                          style={[
                            styles.bodyText,
                            {
                              fontSize,
                              lineHeight: fontSize * lineHeightMultiplier,
                              flex: 1,
                              color: rc.text,
                              fontFamily: readingFontFamily,
                            },
                          ]}
                        >
                          {renderInlineFormatting(para.slice(1), {
                            fontFamily: fonts.serifBoldItalic,
                          })}
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <Text
                      key={i}
                      style={[
                        styles.bodyText,
                        {
                          fontSize,
                          lineHeight: fontSize * lineHeightMultiplier,
                          marginTop: fontSize,
                          color: rc.text,
                          fontFamily: readingFontFamily,
                        },
                      ]}
                    >
                      {renderInlineFormatting(para, {
                        fontFamily: fonts.serifBoldItalic,
                      })}
                    </Text>
                  );
                })}
              </View>
            ) : (
              <Text
                style={[
                  styles.bodyText,
                  {
                    fontSize,
                    lineHeight: fontSize * lineHeightMultiplier,
                    color: rc.textSecondary,
                    fontStyle: "italic",
                  },
                ]}
              >
                Bu bölümde henüz içerik yok.
              </Text>
            )}

            {gated ? (
              /* ── Reading gate ─────────────────────────────────── */
              <View>
                {/* Fade overlay — simulated gradient */}
                <View
                  pointerEvents="none"
                  style={{ height: 80, marginTop: -80, overflow: "hidden" }}
                >
                  {[0.12, 0.25, 0.42, 0.6, 0.78, 0.92].map((opacity, i) => (
                    <View
                      key={i}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: Math.floor((i / 6) * 80),
                        height: Math.ceil(80 / 6) + 1,
                        backgroundColor: rc.background,
                        opacity,
                      }}
                    />
                  ))}
                </View>

                {/* Gate card */}
                <View
                  style={[
                    styles.gateCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.gateKicker,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={11}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 11, lineHeight: 14,
                        fontWeight: "700",
                        color: colors.primary,
                      }}
                    >
                      Önizleme · Bölüm 1
                    </Text>
                  </View>

                  <View style={{ marginVertical: 12 }}>
                    <BloomMark size={44} />
                  </View>

                  <Text
                    style={[
                      styles.gateTitle,
                      { fontFamily: fonts.serif, color: colors.text },
                    ]}
                  >
                    Gerisi seni bekliyor
                  </Text>
                  <Text
                    style={[styles.gateSub, { color: colors.textSecondary }]}
                  >
                    Bu bölümün kalanını ve{" "}
                    {totalChapters > 1
                      ? `${totalChapters} bölümün tamamını`
                      : "tüm hikâyeyi"}{" "}
                    okumak için ücretsiz bir hesap oluştur.
                  </Text>

                  {/* Benefit chips */}
                  <View style={styles.gateChips}>
                    {[
                      { icon: "infinite-outline", label: "Sınırsız okuma" },
                      {
                        icon: "bookmark-outline",
                        label: "Kaldığın yerden devam",
                      },
                      { icon: "cloud-offline-outline", label: "Çevrimdışı" },
                    ].map((c) => (
                      <View
                        key={c.label}
                        style={[
                          styles.gateChip,
                          { backgroundColor: colors.primarySoft },
                        ]}
                      >
                        <Ionicons
                          name={c.icon as any}
                          size={13}
                          color={colors.primary}
                        />
                        <Text
                          style={{
                            fontSize: 12, lineHeight: 16,
                            fontWeight: "600",
                            color: colors.primary,
                          }}
                        >
                          {c.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.gatePrimaryBtn}
                    onPress={() => startAuth("signup")}
                    activeOpacity={0.88}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 15, lineHeight: 20}}
                    >
                      Ücretsiz Hesap Oluştur
                    </Text>
                    <Ionicons name="arrow-forward" size={17} color="#fff" />
                  </TouchableOpacity>

                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 17}}>
                      Zaten üye misin?{" "}
                    </Text>
                    <TouchableOpacity onPress={() => startAuth("login")}>
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "700",
                          fontSize: 13, lineHeight: 17,
                        }}
                      >
                        Giriş yap
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* ── Chapter end divider ──────────────────────────── */
              <View style={styles.chapterEnd}>
                <View
                  style={[
                    styles.chapterEndDot,
                    { backgroundColor: colors.bloom },
                  ]}
                />
                <Text
                  variant="body"
                  color={rc.textSecondary}
                  style={{ fontStyle: "italic", fontSize: 14 }}
                >
                  Bölüm sonu
                </Text>
                <View
                  style={[
                    styles.chapterEndDot,
                    { backgroundColor: colors.bloom },
                  ]}
                />
              </View>
            )}

            {/* Bölüm-bazlı beğeni (bkz. YAPILACAKLAR 2.3) — yalnızca yeni
                veri modeline geçmiş hikâyelerde, misafirlere gösterilmez. */}
            {!gated && chapterLikeState && (
              <TouchableOpacity
                onPress={handleToggleChapterLike}
                style={styles.chapterLikeRow}
              >
                <Ionicons
                  name={chapterLikeState.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={chapterLikeState.liked ? colors.bloom : rc.textSecondary}
                />
                <Text variant="label" color={chapterLikeState.liked ? colors.bloom : rc.textSecondary}>
                  Bu bölümü beğen{chapterLikeState.count > 0 ? ` · ${chapterLikeState.count}` : ''}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 120 }} />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom chrome ───────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.bottomChrome,
          {
            paddingBottom: insets.bottom + 10,
            backgroundColor: rc.surface + "EB",
            borderTopColor: rc.border,
            opacity: chromeAnim,
            transform: [
              {
                translateY: chromeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [72 + insets.bottom, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={chromeVisible ? "auto" : "none"}
      >
        <TouchableOpacity onPress={handleLike} style={styles.chromeStat}>
          <Ionicons
            name={isLiked() ? "heart" : "heart-outline"}
            size={22}
            color={isLiked() ? colors.bloom : rc.textSecondary}
          />
          <Text
            variant="label"
            color={isLiked() ? colors.bloom : rc.textSecondary}
          >
            {fmt(story.likesCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chromeStat, { marginLeft: 14 }]}
          onPress={() => {
            if (!requireAuth("comment")) return;
            router.push(`/story/${id}/comments?chapter=${currentChapterIndex}` as any);
          }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={rc.textSecondary}
          />
          <Text variant="label" color={rc.textSecondary}>
            {fmt(story.commentsCount)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.chromeStat, { marginLeft: 14 }]}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={rc.textSecondary}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {gated ? (
          <Button
            label="Devamını Oku"
            variant="primary"
            size="sm"
            icon="lock-closed-outline"
            iconRight="arrow-forward"
            onPress={() => requireAuth("read")}
          />
        ) : currentChapterIndex < totalChapters - 1 ? (
          <Button
            label="Sonraki Bölüm"
            variant="primary"
            size="sm"
            iconRight="arrow-forward"
            onPress={goNext}
          />
        ) : (
          <Button
            label="Yorumlar"
            variant="secondary"
            size="sm"
            icon="chatbubble-outline"
            onPress={() => {
              if (!requireAuth("comment")) return;
              router.push(`/story/${id}/comments?chapter=${currentChapterIndex}` as any);
            }}
          />
        )}
      </Animated.View>

      {/* Overflow menu */}
      {showMenu && (
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                top: insets.top + 52,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                if (!requireAuth("save")) return;
                setListSheetVisible(true);
              }}
            >
              <Ionicons
                name="bookmarks-outline"
                size={18}
                color={colors.text}
              />
              <Text variant="body">Listeye ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Ionicons name="flag-outline" size={18} color={colors.text} />
              <Text variant="body">Hikâyeyi bildir</Text>
            </TouchableOpacity>
            {currentUser?.id !== story.authorId && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleBlockAuthor}
              >
                <Ionicons
                  name="person-remove-outline"
                  size={18}
                  color={colors.error}
                />
                <Text variant="body" color={colors.error}>
                  Yazarı engelle
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      )}

      <ReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        target={{
          type: "story",
          targetId: String(id),
          reportedUserId: story.authorId,
        }}
      />

      <AddToListSheet
        visible={listSheetVisible}
        onClose={() => setListSheetVisible(false)}
        storyId={String(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ ios: { backdropFilter: 'blur(10px)' } }),
  },
  chromeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPanel: {
    position: 'absolute',
    right: Spacing.screenX,
    zIndex: 20,
    flexDirection: 'column',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  body: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 120,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomWidth: 1,
  },
  chapterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  dropCapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  dropCap: {
    fontSize: 52,
    lineHeight: 68,
    fontWeight: '700',
    paddingLeft: 2,
    paddingRight: 12,
    marginTop: 2,
  },
  bodyText: {
    fontWeight: '400',
  },
  chapterEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 34,
    marginBottom: 8,
  },
  chapterEndDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chapterLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  bottomChrome: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 10,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ ios: { backdropFilter: 'blur(10px)' } }),
  },
  chromeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  menuCard: {
    position: 'absolute',
    right: Spacing.screenX,
    minWidth: 200,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  /* gate card */
  gateCard: {
    marginTop: 8, marginHorizontal: 0,
    borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: 'center',
    width: '100%', maxWidth: 420, alignSelf: 'center',
  },
  gateKicker: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
  },
  gateTitle: {
    fontSize: 22, fontWeight: '700', letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 8, lineHeight: 30,
  },
  gateSub: {
    fontSize: 14, lineHeight: 21, textAlign: 'center',
    marginBottom: 18, maxWidth: 290,
  },
  gateChips: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, justifyContent: 'center',
    marginBottom: 20,
  },
  gateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  gatePrimaryBtn: {
    width: '100%', height: 52, borderRadius: 999,
    backgroundColor: '#FF5C8A',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 5,
  },
});

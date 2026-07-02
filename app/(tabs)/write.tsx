import {
  Screen, Button, CategoryChip, IconButton, SegmentedControl } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { imageUploadService } from '@/services/imageUploadService';
import { authState$ } from '@/store/authStore';
import { storyActions, storyState$ } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
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

const GENRES: StoryCategory[] = [
  'romance', 'fantasy', 'mystery', 'drama',
  'adventure', 'horror', 'comedy', 'poetry', 'sci_fi',
];

export default observer(function WriteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { bottom: safeBottom } = useSafeAreaInsets();
  // Tab bar: 64px bar + safe area bottom padding (minimum 10px)
  const TAB_BAR_HEIGHT = 64 + Math.max(safeBottom, 10);
  const { user: currentUser } = authState$.get();
  const { isLoading } = storyState$.get();

  const [writeMode, setWriteMode] = useState<'quick' | 'advanced'>('quick');
  const [focusMode, setFocusMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [coverSheetVisible, setCoverSheetVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Story state
  const [storyTitle, setStoryTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [storyCategory, setStoryCategory] = useState<StoryCategory>('other');
  const [storyDescription, setStoryDescription] = useState('');
  const [storyTags, setStoryTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMature, setIsMature] = useState(false);
  const [chapters, setChapters] = useState([
    { id: '1', title: 'Bölüm 1', content: '' },
  ]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);

  const s = createStyles(colors);

  // Keyboard dismiss on tab blur
  useFocusEffect(
    useCallback(() => {
      return () => { Keyboard.dismiss(); };
    }, [])
  );

  // Local draft persistence — survives app close / accidental navigation.
  // We keep the in-progress form in AsyncStorage (not Firestore) so we don't
  // spam the backend with throwaway documents on every keystroke.
  const draftKey = currentUser?.id ? `writeDraft_${currentUser.id}` : null;
  const restoredRef = useRef(false);

  const clearLocalDraft = useCallback(() => {
    if (draftKey) AsyncStorage.removeItem(draftKey).catch(() => {});
  }, [draftKey]);

  // Restore a previously saved draft once, on first mount with a known user.
  useEffect(() => {
    if (!draftKey || restoredRef.current) return;
    restoredRef.current = true;
    AsyncStorage.getItem(draftKey)
      .then(raw => {
        if (!raw) return;
        const d = JSON.parse(raw);
        if (!d || (!d.storyTitle?.trim() && !d.storyContent?.trim())) return;
        setWriteMode(d.writeMode ?? 'quick');
        setStoryTitle(d.storyTitle ?? '');
        setChapterTitle(d.chapterTitle ?? '');
        setStoryContent(d.storyContent ?? '');
        setStoryCategory(d.storyCategory ?? 'other');
        setStoryDescription(d.storyDescription ?? '');
        setStoryTags(Array.isArray(d.storyTags) ? d.storyTags : []);
        setCoverImage(d.coverImage ?? null);
        setIsCompleted(!!d.isCompleted);
        setIsMature(!!d.isMature);
        if (Array.isArray(d.chapters) && d.chapters.length > 0) setChapters(d.chapters);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      })
      .catch(() => {});
  }, [draftKey]);

  // Auto-save — debounced, writes the real form snapshot to AsyncStorage.
  useEffect(() => {
    if (!draftKey || !restoredRef.current) return;
    if (!storyTitle.trim() && !storyContent.trim() && !chapters.some(c => c.content.trim())) return;
    setAutoSaveStatus('saving');
    const t = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(draftKey, JSON.stringify({
          writeMode, storyTitle, chapterTitle, storyContent, storyCategory,
          storyDescription, storyTags, coverImage, isCompleted, isMature, chapters,
          savedAt: Date.now(),
        }));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch {
        setAutoSaveStatus(null);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [draftKey, writeMode, storyTitle, chapterTitle, storyContent, storyCategory,
      storyDescription, storyTags, coverImage, isCompleted, chapters]);

  const wordCount = storyContent.trim() ? storyContent.trim().split(/\s+/).length : 0;
  const charCount = storyContent.length;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));

  const getReadingTime = (text: string) =>
    Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(w => w).length / 200));

  const isValid = storyTitle.trim().length >= 3 && storyContent.trim().length >= 50;

  const resetForm = () => {
    setStoryTitle(''); setChapterTitle(''); setStoryContent('');
    setStoryCategory('other'); setStoryDescription(''); setStoryTags([]);
    setCoverImage(null); setIsCompleted(false); setIsMature(false); setWriteMode('quick');
    setChapters([{ id: '1', title: 'Bölüm 1', content: '' }]);
    setCurrentChapterIndex(0);
    setAutoSaveStatus(null);
    clearLocalDraft();
  };

  const buildStoryData = (isPublished: boolean) => {
    const content = writeMode === 'quick'
      ? storyContent
      : chapters.map(c => c.content).join('\n§§\n');
    const data: any = {
      title: storyTitle.trim(),
      description: storyDescription.trim() || storyContent.substring(0, 200) + '...',
      content,
      category: storyCategory,
      tags: storyTags,
      isCompleted,
      isPublished,
      chaptersCount: writeMode === 'quick' ? 1 : chapters.length,
      readingTime: getReadingTime(content),
      isPremium: false,
      authorId: currentUser!.id,
      isBook: writeMode === 'advanced' && chapters.length > 1,
      targetAudience: isMature ? 'adult' : 'all',
    };
    if (coverImage) data.coverImage = coverImage;
    if (writeMode === 'advanced' && chapters.length > 1) {
      data.chapterTitles = chapters.map(c => c.title);
    } else if (writeMode === 'quick' && chapterTitle.trim()) {
      // Hızlı modda girilen bölüm başlığı da kaybolmasın — okuyucu
      // story.chapterTitles[0]'ı "Bölüm 1 — <başlık>" olarak gösterir.
      data.chapterTitles = [chapterTitle.trim()];
    }
    return data;
  };

  const validateAndWarn = (): boolean => {
    if (!currentUser?.id) {
      Alert.alert('Giriş gerekli', 'Devam etmek için giriş yapmalısın.');
      return false;
    }
    if (storyTitle.trim().length < 3) {
      Alert.alert('Başlık eksik', 'Hikaye başlığı en az 3 karakter olmalı.');
      return false;
    }
    if (storyContent.trim().length < 50) {
      Alert.alert('İçerik eksik', 'Hikaye içeriği en az 50 karakter olmalı.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateAndWarn()) return;
    try {
      let coverUrl: string | undefined;
      if (coverImage && !coverImage.startsWith('http')) {
        try { coverUrl = await imageUploadService.uploadBookCover('temp', coverImage); } catch {}
      } else if (coverImage) {
        coverUrl = coverImage;
      }
      const data = buildStoryData(false);
      if (coverUrl) data.coverImage = coverUrl;
      const result = await storyActions.createStory(data);
      if (result.success) {
        clearLocalDraft();
        Alert.alert('Kaydedildi', 'Hikayen taslak olarak kaydedildi.', [
          { text: 'Profile git', onPress: () => router.push('/(tabs)/profile') },
          { text: 'Yeni hikaye', onPress: resetForm },
        ]);
      } else {
        Alert.alert('Hata', result.error || 'Hikaye kaydedilemedi.');
      }
    } catch {
      Alert.alert('Hata', 'Hikaye kaydedilemedi.');
    }
  };

  const handlePublish = async () => {
    if (!validateAndWarn()) return;
    // Yayınlanan her hikâye gerçek bir tür almalı — sessizce 'other' kaydı yok.
    if (storyCategory === 'other') {
      Alert.alert('Tür seç', 'Yayınlamadan önce hikâyen için bir tür seçmelisin.');
      return;
    }
    Alert.alert(
      'Hikayeyi yayınla',
      `"${storyTitle}" adlı hikayeni yayınlamak istiyor musun? (${wordCount} kelime, ~${readMin} dk okuma)`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yayınla',
          onPress: async () => {
            try {
              let coverUrl: string | undefined;
              if (coverImage && !coverImage.startsWith('http')) {
                try { coverUrl = await imageUploadService.uploadBookCover('temp', coverImage); } catch {}
              } else if (coverImage) {
                coverUrl = coverImage;
              }
              const data = buildStoryData(true);
              if (coverUrl) data.coverImage = coverUrl;
              const result = await storyActions.createStory(data);
              if (result.success) {
                clearLocalDraft();
                Alert.alert('Harika!', 'Hikayen yayınlandı ve artık herkes okuyabilir.', [
                  { text: 'Profile git', onPress: () => router.push('/(tabs)/profile') },
                  { text: 'Yeni hikaye', onPress: resetForm },
                ]);
              } else {
                Alert.alert('Hata', result.error || 'Hikaye yayınlanamadı.');
              }
            } catch {
              Alert.alert('Hata', 'Hikaye yayınlanamadı.');
            }
          },
        },
      ]
    );
  };

  const handlePickCover = async () => {
    try {
      const uri = await imageUploadService.pickImageFromGallery();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Resim seçilemedi.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const uri = await imageUploadService.takePhotoWithCamera();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf çekilemedi.');
    }
  };

  const handleAddChapter = () => {
    const next = [...chapters, { id: Date.now().toString(), title: `Bölüm ${chapters.length + 1}`, content: '' }];
    setChapters(next);
    setCurrentChapterIndex(next.length - 1);
  };

  const handleDeleteChapter = (i: number) => {
    if (chapters.length <= 1) return;
    const next = chapters.filter((_, idx) => idx !== i);
    setChapters(next);
    setCurrentChapterIndex(Math.max(0, currentChapterIndex - (i <= currentChapterIndex ? 1 : 0)));
  };

  const updateChapter = (i: number, field: 'title' | 'content', val: string) => {
    const next = [...chapters];
    next[i] = { ...next[i], [field]: val };
    setChapters(next);
  };

  const curChapter = chapters[currentChapterIndex] ?? chapters[0];
  const bodyText = writeMode === 'quick' ? storyContent : curChapter?.content ?? '';
  const setBodyText = (v: string) =>
    writeMode === 'quick' ? setStoryContent(v) : updateChapter(currentChapterIndex, 'content', v);

  // İmleç konumunu takip et — biçim yardımcıları metni imlecin olduğu yere ekler.
  const [bodySel, setBodySel] = useState({ start: 0, end: 0 });
  const insertAtCursor = (snippet: string) => {
    const text = bodyText;
    const start = Math.min(bodySel.start, text.length);
    const end = Math.min(bodySel.end, text.length);
    const next = text.slice(0, start) + snippet + text.slice(end);
    setBodyText(next);
    const caret = start + snippet.length;
    setBodySel({ start: caret, end: caret });
  };

  return (
    <Screen style={s.root}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Chapter picker pill */}
        {writeMode === 'advanced' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, maxHeight: 36 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {chapters.map((ch, i) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[s.chapterPill, currentChapterIndex === i && s.chapterPillActive]}
                  onPress={() => setCurrentChapterIndex(i)}
                >
                  <Text style={[s.chapterPillText, currentChapterIndex === i && s.chapterPillTextActive]}>
                    {ch.title}
                  </Text>
                  {chapters.length > 1 && (
                    <TouchableOpacity onPress={() => handleDeleteChapter(i)} hitSlop={4}>
                      <Ionicons name="close" size={13} color={currentChapterIndex === i ? '#fff' : colors.textLight} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.addChapterPill} onPress={handleAddChapter}>
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={s.chapterPill}>
            <Text style={s.chapterPillText}>Bölüm 1</Text>
            <Ionicons name="chevron-down" size={13} color={colors.textLight} />
          </View>
        )}

        {/* Spacer sadece quick modda gerekli; advanced modda ScrollView zaten flex: 1 alıyor */}
        {writeMode !== 'advanced' && <View style={{ flex: 1 }} />}

        {/* Autosave */}
        {autoSaveStatus && (
          <View style={s.autoSave}>
            {autoSaveStatus === 'saving'
              ? <ActivityIndicator size="small" color={colors.success} />
              : <Ionicons name="cloud-done-outline" size={15} color={colors.success} />}
            <Text style={s.autoSaveText}>
              {autoSaveStatus === 'saving' ? 'Kaydediliyor' : 'Kaydedildi'}
            </Text>
          </View>
        )}

        <IconButton
          icon={focusMode ? 'contract-outline' : 'scan-outline'}
          variant="sunk"
          size={38}
          onPress={() => setFocusMode(f => !f)}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        {/* ── Story setup card ───────────────────────────────────── */}
        {!focusMode && (
          <View style={[s.setupCard, { margin: Spacing.screenX, marginBottom: 0 }]}>
            <SegmentedControl
              options={[
                { value: 'quick', label: 'Hızlı Yaz', icon: 'flash-outline' },
                { value: 'advanced', label: 'Detaylı', icon: 'options-outline' },
              ]}
              value={writeMode}
              onChange={v => setWriteMode(v as 'quick' | 'advanced')}
            />

            {/* Title input */}
            <View style={[s.inputBox, { marginTop: 16 }]}>
              <Ionicons name="book-outline" size={18} color={storyTitle ? colors.primary : colors.textLight} />
              <TextInput
                style={s.titleInput}
                value={storyTitle}
                onChangeText={setStoryTitle}
                placeholder="Hikaye Başlığı"
                placeholderTextColor={colors.textLight}
                maxLength={100}
              />
            </View>
            {storyTitle.length > 0 && (
              <Text style={s.charCount}>{storyTitle.length}/100</Text>
            )}

            {/* Genre chips */}
            <View style={{ marginTop: 16 }}>
              <Text style={s.fieldLabel}>
                Tür <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={s.chipWrap}>
                {GENRES.map(g => (
                  <CategoryChip
                    key={g}
                    category={g}
                    active={storyCategory === g}
                    onPress={() => setStoryCategory(g)}
                  />
                ))}
              </View>
            </View>

            {/* Cover image thumb */}
            {coverImage && (
              <View style={s.coverRow}>
                <Image source={{ uri: coverImage }} style={s.coverThumb} />
                <TouchableOpacity onPress={() => setCoverImage(null)} style={s.coverRemove}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Writing canvas ─────────────────────────────────────── */}
        <View style={[s.canvas, { margin: Spacing.screenX, marginTop: 14 }]}>
          {/* Overline */}
          <Text style={s.canvasOverline} numberOfLines={1}>
            {storyTitle || 'Başlıksız'} · {writeMode === 'quick' ? 'Bölüm 1' : curChapter?.title || 'Bölüm 1'}
          </Text>

          {/* Chapter title */}
          <TextInput
            style={s.chapterTitleInput}
            value={writeMode === 'quick' ? chapterTitle : curChapter?.title ?? ''}
            onChangeText={v => writeMode === 'quick' ? setChapterTitle(v) : updateChapter(currentChapterIndex, 'title', v)}
            placeholder="Bölüm başlığı"
            placeholderTextColor={colors.textLight}
            maxLength={80}
          />

          <View style={s.divider} />

          {/* Body */}
          <TextInput
            style={s.bodyInput}
            value={bodyText}
            onChangeText={setBodyText}
            onSelectionChange={e => setBodySel(e.nativeEvent.selection)}
            placeholder="Hikayeni anlatmaya başla…"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Advanced options ───────────────────────────────────── */}
        {writeMode === 'advanced' && (
          <View style={{ paddingHorizontal: Spacing.screenX }}>
            <TouchableOpacity style={s.advancedToggle} onPress={() => setShowAdvanced(v => !v)}>
              <Ionicons name={showAdvanced ? 'chevron-up' : 'options-outline'} size={18} color={colors.primary} />
              <Text style={s.advancedToggleText}>
                {showAdvanced ? 'Gelişmiş seçenekleri kapat' : 'Gelişmiş seçenekler'}
              </Text>
            </TouchableOpacity>

            {showAdvanced && (
              <View style={s.advancedBox}>
                {/* Description */}
                <Text style={s.fieldLabel}>Açıklama</Text>
                <TextInput
                  style={s.descInput}
                  value={storyDescription}
                  onChangeText={setStoryDescription}
                  placeholder="Hikaye hakkında kısa bir açıklama…"
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={[s.charCount, { textAlign: 'right' }]}>{storyDescription.length}/500</Text>

                {/* Tags */}
                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Etiketler</Text>
                <View style={s.tagRow}>
                  <TextInput
                    style={s.tagInput}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Etiket ekle"
                    placeholderTextColor={colors.textLight}
                    onSubmitEditing={() => {
                      if (newTag.trim() && !storyTags.includes(newTag.trim()) && storyTags.length < 5) {
                        setStoryTags([...storyTags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                    maxLength={20}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[s.tagAddBtn, (!newTag.trim() || storyTags.length >= 5) && { opacity: 0.4 }]}
                    onPress={() => {
                      if (newTag.trim() && !storyTags.includes(newTag.trim()) && storyTags.length < 5) {
                        setStoryTags([...storyTags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                    disabled={!newTag.trim() || storyTags.length >= 5}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                {storyTags.length > 0 && (
                  <View style={s.chipWrap}>
                    {storyTags.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={s.tagChip}
                        onPress={() => setStoryTags(storyTags.filter(x => x !== t))}
                      >
                        <Text style={s.tagChipText}>#{t}</Text>
                        <Ionicons name="close" size={13} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Completion toggle */}
                <TouchableOpacity
                  style={[s.completionRow, { marginTop: 16 }]}
                  onPress={() => setIsCompleted(v => !v)}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isCompleted ? colors.success : colors.textLight}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.completionTitle}>Hikaye tamamlandı</Text>
                    <Text style={s.completionSub}>
                      {isCompleted ? 'Tamamlanmış olarak işaretlendi' : 'Devam ediyor'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Mature content toggle */}
                <TouchableOpacity
                  style={[s.completionRow, { marginTop: 10 }]}
                  onPress={() => setIsMature(v => !v)}
                >
                  <Ionicons
                    name={isMature ? 'warning' : 'warning-outline'}
                    size={22}
                    color={isMature ? colors.error : colors.textLight}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.completionTitle}>Yetişkin içeriği (18+)</Text>
                    <Text style={s.completionSub}>
                      {isMature ? 'Olgun içerik olarak işaretlendi' : 'Herkese uygun'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky bottom bar ──────────────────────────────────────── */}
      <View style={[s.bottomBar, { borderTopColor: colors.border, paddingBottom: TAB_BAR_HEIGHT + 12 }]}>
        {/* Stats row */}
        <View style={s.statsRow}>
          <Text style={[s.statMain, { color: colors.text }]}>{wordCount.toLocaleString('tr-TR')}</Text>
          <Text style={s.statSub}> kelime</Text>
          <View style={{ flex: 1 }} />
          <Text style={s.statMeta}>{charCount} karakter · ~{readMin} dk okuma</Text>
        </View>

        {/* Toolbar */}
        <View style={s.toolbar}>
          <TouchableOpacity style={s.toolBtn} onPress={() => setCoverSheetVisible(true)}>
            <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          {/* Madde işareti satırı */}
          <TouchableOpacity style={s.toolBtn} onPress={() => insertAtCursor('\n• ')}>
            <Ionicons name="list-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          {/* Sahne ayıracı */}
          <TouchableOpacity style={s.toolBtn} onPress={() => insertAtCursor('\n\n* * *\n\n')}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          {/* Yeni paragraf */}
          <TouchableOpacity style={s.toolBtn} onPress={() => insertAtCursor('\n\n')}>
            <Ionicons name="return-down-forward-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <Button
            label="Önizle"
            variant="secondary"
            size="md"
            icon="eye-outline"
            onPress={() => { Keyboard.dismiss(); setPreviewVisible(true); }}
            disabled={!isValid || isLoading}
            style={{ flex: 1 }}
          />
          <Button
            label="Yayınla"
            variant="primary"
            size="md"
            iconRight="arrow-forward"
            onPress={handlePublish}
            disabled={!isValid || isLoading}
            style={{ flex: 1.4 }}
          />
        </View>
      </View>

      {/* ── Cover image bottom sheet ────────────────────────────────── */}
      <Modal
        visible={coverSheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCoverSheetVisible(false)}
      >
        <View style={s.sheetRoot}>
          <Pressable style={s.sheetBackdrop} onPress={() => setCoverSheetVisible(false)} />
          <View style={[s.sheetContent, { backgroundColor: colors.surface, paddingBottom: safeBottom + 16 }]}>
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.text }]}>Kapak resmi ekle</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>Hikayene görsel bir kapak seç</Text>

            <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => { setCoverSheetVisible(false); handlePickCover(); }}>
              <View style={[s.modalIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="images" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modalBtnText, { color: colors.text }]}>Galeriden seç</Text>
                <Text style={[s.modalBtnSub, { color: colors.textSecondary }]}>Mevcut fotoğraflarından seç</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => { setCoverSheetVisible(false); handleTakePhoto(); }}>
              <View style={[s.modalIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="camera" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modalBtnText, { color: colors.text }]}>Fotoğraf çek</Text>
                <Text style={[s.modalBtnSub, { color: colors.textSecondary }]}>Kamerayla yeni bir fotoğraf çek</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setCoverSheetVisible(false)}>
              <Text style={[s.cancelText, { color: colors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Reader preview ──────────────────────────────────────────── */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.previewHeader, { paddingTop: safeBottom + 44, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)} hitSlop={8} style={s.toolBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[s.previewHeaderTitle, { color: colors.textSecondary }]}>Önizleme</Text>
            <View style={{ width: 38 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 80 }}>
            {coverImage && (
              <Image source={{ uri: coverImage }} style={s.previewCover} resizeMode="cover" />
            )}
            <Text style={[s.previewKicker, { color: colors.primary }]}>
              {(curChapter?.title || chapterTitle || 'Bölüm 1').toUpperCase()}
            </Text>
            <Text style={[s.previewTitle, { color: colors.text }]}>{storyTitle || 'Başlıksız'}</Text>
            <Text style={[s.previewAuthor, { color: colors.textSecondary }]}>
              {currentUser?.displayName || currentUser?.username || 'Sen'}
            </Text>
            <View style={[s.divider, { marginVertical: 18 }]} />
            {(writeMode === 'quick'
              ? [{ title: chapterTitle, content: storyContent }]
              : chapters
            ).map((ch, ci) => {
              const paras = (ch.content || '').split('\n\n').filter(p => p.trim());
              return (
                <View key={ci} style={{ marginBottom: 28 }}>
                  {writeMode === 'advanced' && (
                    <Text style={[s.previewChapterTitle, { color: colors.text }]}>
                      {ch.title || `Bölüm ${ci + 1}`}
                    </Text>
                  )}
                  {paras.length > 0 ? paras.map((p, pi) => (
                    <Text key={pi} style={[s.previewBody, { color: colors.text }]}>{p}</Text>
                  )) : (
                    <Text style={[s.previewBody, { color: colors.textLight, fontStyle: 'italic' }]}>
                      Bu bölümde henüz içerik yok.
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Preview footer — review & act */}
          <View style={[s.bottomBar, { position: 'relative', borderTopColor: colors.border, paddingBottom: safeBottom + 14 }]}>
            <View style={s.actionRow}>
              <Button
                label="Taslak Kaydet"
                variant="secondary"
                size="md"
                icon="save-outline"
                onPress={() => { setPreviewVisible(false); handleSaveDraft(); }}
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <Button
                label="Yayınla"
                variant="primary"
                size="md"
                iconRight="arrow-forward"
                onPress={() => { setPreviewVisible(false); handlePublish(); }}
                disabled={isLoading}
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading overlay */}
      {isLoading && (
        <View style={s.loadingOverlay}>
          <View style={[s.loadingBox, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[s.loadingText, { color: colors.text }]}>Kaydediliyor…</Text>
          </View>
        </View>
      )}
    </Screen>
  );
});

const createStyles = (colors: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: Spacing.screenX,
      paddingVertical: 10,
    },
    chapterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 32,
      paddingHorizontal: 12,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chapterPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chapterPillText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    chapterPillTextActive: { color: '#fff' },
    addChapterPill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    autoSave: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginRight: 6,
    },
    autoSaveText: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },

    // Setup card
    setupCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 0,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 52,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    titleInput: {
      flex: 1,
      fontFamily: Fonts.sans,
      fontSize: 16,
      color: colors.text,
    },
    charCount: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      color: colors.textLight,
      marginTop: 5,
      paddingLeft: 4,
    },
    fieldLabel: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    coverRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    coverThumb: {
      width: 56,
      height: 80,
      borderRadius: Radius.sm,
    },
    coverRemove: { padding: 2 },

    // Writing canvas
    canvas: {
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
    },
    canvasOverline: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: colors.textLight,
      marginBottom: 12,
    },
    chapterTitleInput: {
      fontFamily: Fonts.serif,
      fontSize: 25,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 30,
      padding: 0,
      marginBottom: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 14,
    },
    bodyInput: {
      fontFamily: Fonts.serif,
      fontSize: 17,
      lineHeight: 30,
      color: colors.text,
      minHeight: 220,
      padding: 0,
      textAlignVertical: 'top',
    },

    // Advanced options
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      marginTop: 12,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    advancedToggleText: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    advancedBox: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginTop: 10,
    },
    descInput: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: 12,
      minHeight: 80,
      lineHeight: 22,
    },
    tagRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    tagInput: {
      flex: 1,
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tagAddBtn: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primarySoft,
      borderRadius: Radius.pill,
    },
    tagChipText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    completionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    completionTitle: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    completionSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Bottom bar
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      paddingHorizontal: Spacing.screenX,
      paddingTop: 12,
      paddingBottom: 20,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 10,
    },
    statMain: {
      fontFamily: Fonts.serif,
      fontSize: 20,
      fontWeight: '700',
    },
    statSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statMeta: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textLight,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginBottom: 10,
    },
    toolBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.sm,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalBox: {
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    sheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheetContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 2,
      marginBottom: 14,
    },
    modalTitle: {
      fontFamily: Fonts.serif,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 6,
    },
    modalSub: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 22,
    },
    modalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.lg,
      borderWidth: 1,
      marginBottom: 10,
    },
    modalIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      fontWeight: '600',
    },
    modalBtnSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      marginTop: 2,
    },
    cancelBtn: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelText: {
      fontFamily: Fonts.sans,
      fontSize: 16,
      fontWeight: '600',
    },

    // Loading
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingBox: {
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      gap: 14,
    },
    loadingText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      fontWeight: '600',
    },

    // Reader preview
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenX,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    previewHeaderTitle: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    previewCover: {
      width: '100%',
      height: 200,
      borderRadius: Radius.lg,
      marginBottom: 18,
    },
    previewKicker: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      marginBottom: 8,
    },
    previewTitle: {
      fontFamily: Fonts.serif,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    previewAuthor: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 8,
    },
    previewChapterTitle: {
      fontFamily: Fonts.serif,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 12,
    },
    previewBody: {
      fontFamily: Fonts.serif,
      fontSize: 18,
      lineHeight: 30,
      marginBottom: 14,
    },
  });

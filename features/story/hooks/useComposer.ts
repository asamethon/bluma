import { storyActions } from '@/store/storyStore';
import { Story, StoryCategory } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { joinChapters, splitChapters, StudioChapter } from '../utils/chapterContent';
import { charCount, readingMinutes, wordCount } from '../utils/textStats';
import { useChapterEditor } from './useChapterEditor';

// "Yaz" — tek bir bölümü sessiz bir kâğıt yüzeyinde düzenleyen composer.
// Otomatik kaydetme yalnızca içerik alanlarını yazar (başlık/tür/kapak bilgi
// ekranına aittir); yayınlama açık ve hikâye düzeyindedir. Gövde metni
// useChapterEditor'da işaretsiz (display) halde düzenlenir; depoya _italik_
// işaretli biçim yazılır.
export function useComposer(id: string, chParam?: string) {
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<StudioChapter[]>([]);
  const [index, setIndex] = useState(0);
  const [category, setCategory] = useState<StoryCategory>('other');
  const [isPublished, setIsPublished] = useState(false);

  const [saveState, setSaveState] = useState<'saving' | 'saved' | null>(null);
  const [focus, setFocus] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [preview, setPreview] = useState(false);
  const [menu, setMenu] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kaydetme: bölüm gövdeleri stories/{id}/chapters alt koleksiyonuna yazılır
  // (bkz. YAPILACAKLAR 2.2) — story dokümanında yalnızca metadata kalır, tam
  // içerik artık ana sayfa/feed dinleyicilerinin indirdiği dokümanda taşınmaz.
  const persist = async (next: StudioChapter[]) => {
    const readingTime = readingMinutes(joinChapters(next));
    await Promise.all([
      storyActions.saveChapters(id, next),
      storyActions.updateStory(id, {
        chapterTitles: next.map(c => c.title),
        chapterWordCounts: next.map(c => wordCount(c.content)),
        chaptersCount: next.length,
        isBook: next.length > 1,
        readingTime,
        chaptersInSubcollection: true,
      }),
    ]);
    setSaveState('saved');
    setTimeout(() => setSaveState(null), 1500);
  };

  const scheduleSave = (next: StudioChapter[]) => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void persist(next); }, 800);
  };

  const cur = chapters[index];

  const setChapterTitle = (v: string) => {
    const next = chapters.map((c, i) => (i === index ? { ...c, title: v } : c));
    setChapters(next);
    scheduleSave(next);
  };

  const setChapterBody = (v: string) => {
    const next = chapters.map((c, i) => (i === index ? { ...c, content: v } : c));
    setChapters(next);
    scheduleSave(next);
  };

  const editor = useChapterEditor(setChapterBody);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await storyActions.getStoryById(id);
      if (!alive) return;
      if (!s) {
        Alert.alert('Hata', 'Hikâye bulunamadı.');
        router.back();
        return;
      }
      // Yeni bölüm modeline geçmiş hikâyeler alt koleksiyondan, eskiler
      // (henüz migrasyon script'i çalışmamış) legacy `content` alanından yüklenir.
      const loaded = s.chaptersInSubcollection
        ? await storyActions.loadAllChapters(id)
        : splitChapters(s.content, s.chapterTitles);
      const chs = loaded.length > 0 ? loaded : [{ id: '1', title: 'Bölüm 1', content: '' }];
      setStory(s);
      setCategory(s.category || 'other');
      setIsPublished(!!s.isPublished);
      if (chParam === 'new') {
        const withNew = [...chs, { id: Date.now().toString(), title: `Bölüm ${chs.length + 1}`, content: '' }];
        setChapters(withNew);
        setIndex(withNew.length - 1);
        editor.load('');
      } else {
        const wanted = parseInt(chParam || '0', 10) || 0;
        const idx = Math.max(0, Math.min(chs.length - 1, wanted));
        setChapters(chs);
        setIndex(idx);
        editor.load(chs[idx]?.content ?? '');
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const switchTo = (i: number) => {
    setIndex(i);
    editor.load(chapters[i]?.content ?? '');
    setSheet(false);
  };

  // Boş bölüm KAYDEDİLMEZ — yalnızca içerik yazılınca kalıcılaşır (yayındaki
  // hikâyelerde erken "yeni bölüm" bildirimini de önler).
  const addChapter = () => {
    const next = [...chapters, { id: Date.now().toString(), title: `Bölüm ${chapters.length + 1}`, content: '' }];
    setChapters(next);
    setIndex(next.length - 1);
    editor.load('');
    setSheet(false);
  };

  const deleteChapter = () => {
    if (chapters.length <= 1) {
      Alert.alert('Silinemez', 'Bir hikâyenin en az bir bölümü olmalı.');
      return;
    }
    Alert.alert('Bölümü Sil', 'Bu bölümü silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const next = chapters.filter((_, i) => i !== index);
          const newIndex = Math.max(0, index - 1);
          setChapters(next);
          setIndex(newIndex);
          editor.load(next[newIndex]?.content ?? '');
          void persist(next);
        },
      },
    ]);
  };

  const publish = () => {
    if (category === 'other') {
      Alert.alert('Tür seç', 'Yayınlamadan önce hikâyen için bir tür seçmelisin. "Hikâye Bilgilerini Düzenle" ekranından ekleyebilirsin.');
      return;
    }
    Alert.alert('Hikâyeyi Yayınla', `"${story?.title}" adlı hikâyeni yayınlamak istiyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Yayınla',
        onPress: async () => {
          setPublishing(true);
          if (saveTimer.current) clearTimeout(saveTimer.current);
          const readingTime = readingMinutes(joinChapters(chapters));
          await storyActions.saveChapters(id, chapters);
          const result = await storyActions.updateStory(id, {
            chapterTitles: chapters.map(c => c.title),
            chapterWordCounts: chapters.map(c => wordCount(c.content)),
            chaptersCount: chapters.length,
            isBook: chapters.length > 1,
            readingTime,
            chaptersInSubcollection: true,
            isPublished: true,
          });
          setPublishing(false);
          if (result.success) {
            setIsPublished(true);
            Alert.alert('Harika!', 'Hikâyen yayınlandı ve artık herkes okuyabilir.');
          } else {
            Alert.alert('Hata', result.error || 'Hikâye yayınlanamadı.');
          }
        },
      },
    ]);
  };

  return {
    story, loading, chapters, index, cur, isPublished,
    saveState, focus, setFocus, sheet, setSheet, preview, setPreview,
    menu, setMenu, publishing, imageUploading: editor.imageUploading,
    words: wordCount(editor.display), chars: charCount(editor.display), readMin: readingMinutes(editor.display),
    setChapterTitle, switchTo, addChapter, deleteChapter, publish, insertImage: editor.insertImage,
    // Gövde editörü (display uzayı — işaretler gizli)
    bodyDisplay: editor.display, bodyRanges: editor.ranges,
    italicMode: editor.italicMode, bulletMode: editor.bulletMode, forcedSel: editor.forcedSel,
    onChangeBody: editor.onChangeText, onBodySelectionChange: editor.onSelectionChange,
    toggleItalic: editor.toggleItalic, toggleBullet: editor.toggleBullet, insertAtCursor: editor.insertSnippet,
    editInfo: () => router.push(`/story/edit/${id}`),
    back: () => router.back(),
  };
}

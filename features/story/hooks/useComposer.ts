import i18n from '@/i18n';
import { storyActions } from '@/store/storyStore';
import { challengeActions } from '@/store/challengeStore';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { Story, StoryCategory } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { defaultChapterTitle, joinChapters, splitChapters, StudioChapter } from '../utils/chapterContent';
import { charCount, readingMinutes, wordCount } from '../utils/textStats';
import { useChapterEditor } from './useChapterEditor';

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
  // Effect bağımlılığı OBJE olamaz: `editor` her render'da yeni referans.
  // Yalnızca sabit referanslı `load`'a bağlanıyoruz.
  const loadEditor = editor.load;

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await storyActions.getStoryById(id);
      if (!alive) return;
      if (!s) {
        Alert.alert(i18n.t('common.error'), i18n.t('story.notFound'));
        router.back();
        return;
      }
      const loaded = s.chaptersInSubcollection
        ? await storyActions.loadAllChapters(id)
        : splitChapters(s.content, s.chapterTitles);
      const chs = loaded.length > 0 ? loaded : [{ id: '1', title: defaultChapterTitle(1), content: '' }];
      setStory(s);
      setCategory(s.category || 'other');
      setIsPublished(!!s.isPublished);
      if (chParam === 'new') {
        const withNew = [...chs, { id: Date.now().toString(), title: defaultChapterTitle(chs.length + 1), content: '' }];
        setChapters(withNew);
        setIndex(withNew.length - 1);
        loadEditor('');
      } else {
        const wanted = parseInt(chParam || '0', 10) || 0;
        const idx = Math.max(0, Math.min(chs.length - 1, wanted));
        setChapters(chs);
        setIndex(idx);
        loadEditor(chs[idx]?.content ?? '');
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [chParam, id, loadEditor, router]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const s = await storyActions.getStoryById(id);
        if (!alive || !s) return;
        setStory(s);
        setCategory(s.category || 'other');
      })();
      return () => { alive = false; };
    }, [id]),
  );

  const switchTo = (i: number) => {
    setIndex(i);
    editor.load(chapters[i]?.content ?? '');
    setSheet(false);
  };

  const addChapter = () => {
    const next = [...chapters, { id: Date.now().toString(), title: defaultChapterTitle(chapters.length + 1), content: '' }];
    setChapters(next);
    setIndex(next.length - 1);
    editor.load('');
    setSheet(false);
  };

  const deleteChapter = () => {
    if (chapters.length <= 1) {
      Alert.alert(i18n.t('studio.cannotDeleteTitle'), i18n.t('studio.cannotDeleteMessage'));
      return;
    }
    Alert.alert(i18n.t('studio.deleteChapterTitle'), i18n.t('studio.deleteChapterMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('common.delete'),
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
    const title = (story?.title || '').trim();
    const needsInfo =
      title.length < 3 || title === i18n.t('studio.untitledStory') || category === 'other';
    if (needsInfo) {
      Alert.alert(i18n.t('studio.completeInfoTitle'), i18n.t('studio.completeInfoMessage'), [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('studio.completeInfoAction'),
          onPress: () => router.push(`/story/edit/${id}`),
        },
      ]);
      return;
    }
    Alert.alert(i18n.t('studio.publishTitle'), i18n.t('studio.publishMessage', { title: story?.title }), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('studio.publishAction'),
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
            const firstPublish = !isPublished && !!story?.authorId;
            if (firstPublish) {
              challengeActions.trackAction(story!.authorId, 'storiesPublished').catch(() => { });
            }
            setIsPublished(true);
            // Değerlendirme, kendi uyarımız kapandıktan SONRA istenir ki iki
            // diyalog üst üste binmesin.
            Alert.alert(i18n.t('studio.publishedTitle'), i18n.t('studio.publishedMessage'), [
              {
                text: i18n.t('common.ok'),
                onPress: () => {
                  // Editörden çıkılır: yayın akışının sonu ana akıştır, yoksa
                  // yazar hâlâ "yazıyormuş" gibi bir ekranda kalıyor.
                  router.replace('/(tabs)');
                  if (firstPublish) {
                    // İlk yayın = en güçlü değer anı; eşikleri beklemeden sorulur.
                    reviewPromptActions
                      .recordMoment('storyPublished', { immediate: true })
                      .catch(() => { });
                  }
                },
              },
            ]);
          } else {
            Alert.alert(i18n.t('common.error'), result.error || i18n.t('studio.publishFailed'));
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
    bodyDisplay: editor.display, bodyRanges: editor.ranges,
    italicMode: editor.italicMode, bulletMode: editor.bulletMode, forcedSel: editor.forcedSel,
    onChangeBody: editor.onChangeText, onBodySelectionChange: editor.onSelectionChange,
    toggleItalic: editor.toggleItalic, toggleBullet: editor.toggleBullet, insertAtCursor: editor.insertSnippet,
    editInfo: () => router.push(`/story/edit/${id}`),
    back: () => router.back(),
  };
}

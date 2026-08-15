import { imageUploadService } from '@/services/imageUploadService';
import i18n from '@/i18n';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { adjustRangesForEdit, diffTexts, shiftRanges, splitRangeAtNewlines } from '../utils/editorEdits';
import { buildImageToken } from '../utils/imageToken';
import { ItalicRange, normalizeRanges, parseItalic, serializeItalic } from '../utils/richText';

const BULLET = '• ';

type Sel = { start: number; end: number };

export function useChapterEditor(onCommit: (storedContent: string) => void) {
  const [display, setDisplay] = useState('');
  const [ranges, setRanges] = useState<ItalicRange[]>([]);
  const [italicMode, setItalicMode] = useState(false);
  const [bulletMode, setBulletMode] = useState(false);
  const [sel, setSel] = useState<Sel>({ start: 0, end: 0 });
  const [forcedSel, setForcedSel] = useState<Sel | null>(null);

  // Referansı SABİT olmalı: useComposer'ın yükleme effect'i buna bağımlı.
  // Her render'da yeni fonksiyon dönersek effect sonsuz döner ve yazılan
  // metin sürekli diskteki eski içerikle ezilir.
  const load = useCallback((content: string) => {
    const parsed = parseItalic(content);
    setDisplay(parsed.display);
    setRanges(parsed.ranges);
    setItalicMode(false);
    setBulletMode(false);
    setForcedSel(null);
    setSel({ start: 0, end: 0 });
  }, []);

  const commit = (nextDisplay: string, nextRanges: ItalicRange[]) => {
    const norm = normalizeRanges(nextRanges);
    setDisplay(nextDisplay);
    setRanges(norm);
    onCommit(serializeItalic(nextDisplay, norm));
  };

  const moveCaret = (pos: number) => {
    setSel({ start: pos, end: pos });
    setTimeout(() => setForcedSel({ start: pos, end: pos }), 0);
  };

  const onChangeText = (newText: string) => {
    if (newText === display) return;
    const { pos, removedLen, inserted } = diffTexts(display, newText);
    const italicOn = italicMode && inserted.length > 0 && !inserted.includes('\n');
    let next = adjustRangesForEdit(ranges, pos, removedLen, inserted.length, italicOn);

    if (bulletMode && inserted === '\n' && removedLen === 0) {
      const lineStart = newText.lastIndexOf('\n', pos - 1) + 1;
      if (newText.slice(lineStart, pos) === BULLET) {
        const text = newText.slice(0, lineStart) + newText.slice(pos);
        setBulletMode(false);
        commit(text, shiftRanges(next, lineStart, -BULLET.length));
        moveCaret(lineStart + 1);
        return;
      }
      const text = newText.slice(0, pos + 1) + BULLET + newText.slice(pos + 1);
      commit(text, shiftRanges(next, pos + 1, BULLET.length));
      moveCaret(pos + 1 + BULLET.length);
      return;
    }
    commit(newText, next);
  };

  const onSelectionChange = (s: Sel) => {
    setSel(s);
    if (forcedSel) setForcedSel(null);
  };

  const toggleItalic = () => {
    const start = Math.min(sel.start, display.length);
    const end = Math.min(sel.end, display.length);
    if (end > start) {
      const covered = ranges.some(r => r.start <= start && r.end >= end);
      const next = covered
        ? ranges.flatMap(r =>
            r.start <= start && r.end >= end
              ? [{ start: r.start, end: start }, { start: end, end: r.end }]
              : [r]
          )
        : [...ranges, ...splitRangeAtNewlines(display, start, end)];
      commit(display, next);
      return;
    }
    setItalicMode(m => !m);
  };

  const toggleBullet = () => {
    if (bulletMode) {
      setBulletMode(false);
      return;
    }
    setBulletMode(true);
    const caret = Math.min(sel.start, display.length);
    const lineStart = display.lastIndexOf('\n', caret - 1) + 1;
    if (display.slice(lineStart, lineStart + BULLET.length) === BULLET) return;
    const snippet = caret === 0 || display[caret - 1] === '\n' ? BULLET : '\n' + BULLET;
    const text = display.slice(0, caret) + snippet + display.slice(caret);
    commit(text, adjustRangesForEdit(ranges, caret, 0, snippet.length, false));
    moveCaret(caret + snippet.length);
  };

  const insertSnippet = (snippet: string) => {
    const start = Math.min(sel.start, display.length);
    const end = Math.min(sel.end, display.length);
    const text = display.slice(0, start) + snippet + display.slice(end);
    commit(text, adjustRangesForEdit(ranges, start, end - start, snippet.length, false));
    moveCaret(start + snippet.length);
  };

  const [imageUploading, setImageUploading] = useState(false);
  const insertImage = async () => {
    try {
      const uri = await imageUploadService.pickContentImage();
      if (!uri) return;
      setImageUploading(true);
      const url = await imageUploadService.uploadStoryContentImage(uri);
      insertSnippet(buildImageToken(url));
    } catch (e) {
      Alert.alert(i18n.t('common.error'), e instanceof Error ? e.message : i18n.t('imageUpload.contentError'));
    } finally {
      setImageUploading(false);
    }
  };

  return {
    display, ranges, italicMode, bulletMode, forcedSel, imageUploading,
    load, onChangeText, onSelectionChange, toggleItalic, toggleBullet, insertSnippet, insertImage,
  };
}

import { ItalicRange } from './richText';

// Editör düzenleme yardımcıları — saf fonksiyonlar (React yok).
// Metin display uzayında (işaretsiz) tutulur; her klavye değişikliği ortak
// önek/sonek diff'iyle bulunur ve italik aralıklar buna göre kaydırılır.

// Eski/yeni metin arasındaki tek düzenlemeyi bulur: pos konumunda removedLen
// karakter silinip yerine inserted eklendi.
export function diffTexts(oldText: string, newText: string): {
  pos: number;
  removedLen: number;
  inserted: string;
} {
  let p = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (p < minLen && oldText[p] === newText[p]) p++;
  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (oldEnd > p && newEnd > p && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  return { pos: p, removedLen: oldEnd - p, inserted: newText.slice(p, newEnd) };
}

// Aralıkları bir düzenlemeye göre kaydırır. italicOn ise eklenen metin italik
// aralığa dahil edilir; değilse eklemenin böldüğü aralık ikiye ayrılır
// (aralıklar asla satır sonu üzerinden uzatılmaz — depo biçimi \n içeremez).
export function adjustRangesForEdit(
  ranges: ItalicRange[],
  pos: number,
  removedLen: number,
  insertedLen: number,
  italicOn: boolean
): ItalicRange[] {
  // 1) Silme: [pos, pos+removedLen) aralığı kalkar.
  let next = ranges.map(r => ({
    start: r.start <= pos ? r.start : Math.max(pos, r.start - removedLen),
    end: r.end <= pos ? r.end : Math.max(pos, r.end - removedLen),
  }));
  // 2) Ekleme: pos'tan sonrası insertedLen kadar kayar. Sınır kuralları:
  //    tam pos'ta başlayan aralık kayar (öncesine yazılan normal kalır),
  //    tam pos'ta biten aralık kaymaz (sonrasına yazılan normal kalır).
  next = next.map(r => ({
    start: r.start >= pos ? r.start + insertedLen : r.start,
    end: r.end > pos ? r.end + insertedLen : r.end,
  }));
  // 3) Mod kapalıyken aralık içine yazıldıysa aralığı böl.
  if (!italicOn) {
    next = next.flatMap(r =>
      r.start < pos && r.end > pos + insertedLen
        ? [
            { start: r.start, end: pos },
            { start: pos + insertedLen, end: r.end },
          ]
        : [r]
    );
  } else if (insertedLen > 0) {
    next.push({ start: pos, end: pos + insertedLen });
  }
  return next;
}

// pos ve sonrasındaki aralıkları delta kadar kaydırır (madde dönüşümleri için).
export function shiftRanges(ranges: ItalicRange[], pos: number, delta: number): ItalicRange[] {
  return ranges.map(r => ({
    start: r.start >= pos ? Math.max(pos + Math.min(delta, 0), r.start + delta) : r.start,
    end: r.end > pos ? Math.max(pos, r.end + delta) : r.end,
  }));
}

// Seçim satır sonu içeriyorsa aralığı satır satır böler (depo biçimi gereği).
export function splitRangeAtNewlines(display: string, start: number, end: number): ItalicRange[] {
  const out: ItalicRange[] = [];
  let s = start;
  for (let i = start; i < end; i++) {
    if (display[i] === '\n') {
      if (i > s) out.push({ start: s, end: i });
      s = i + 1;
    }
  }
  if (end > s) out.push({ start: s, end });
  return out;
}

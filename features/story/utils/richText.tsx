import { Fonts } from '@/constants/theme';
import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';

const ITALIC_RE = /_([^_\n]+)_/g;

export type ItalicRange = { start: number; end: number };

export function parseItalic(content: string): { display: string; ranges: ItalicRange[] } {
  if (!content.includes('_')) return { display: content, ranges: [] };
  const ranges: ItalicRange[] = [];
  let display = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  ITALIC_RE.lastIndex = 0;
  while ((match = ITALIC_RE.exec(content))) {
    display += content.slice(lastIndex, match.index);
    ranges.push({ start: display.length, end: display.length + match[1].length });
    display += match[1];
    lastIndex = ITALIC_RE.lastIndex;
  }
  display += content.slice(lastIndex);
  return { display, ranges };
}

export function serializeItalic(display: string, ranges: ItalicRange[]): string {
  if (!ranges.length) return display;
  let out = '';
  let cursor = 0;
  for (const r of ranges) {
    if (r.end <= r.start) continue;
    out += display.slice(cursor, r.start) + '_' + display.slice(r.start, r.end) + '_';
    cursor = r.end;
  }
  out += display.slice(cursor);
  return out;
}

export function normalizeRanges(ranges: ItalicRange[]): ItalicRange[] {
  const sorted = ranges
    .filter(r => r.end > r.start)
    .sort((a, b) => a.start - b.start);
  const out: ItalicRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out;
}

export function renderInlineFormatting(
  text: string,
  italicStyle: TextStyle = { fontFamily: Fonts.serifItalic }
): React.ReactNode {
  if (!text.includes('_')) return text;
  const { display, ranges } = parseItalic(text);
  return renderWithRanges(display, ranges, italicStyle);
}

export function renderWithRanges(
  display: string,
  ranges: ItalicRange[],
  italicStyle: TextStyle
): React.ReactNode {
  if (!ranges.length) return display;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const r of ranges) {
    if (r.start > cursor) parts.push(display.slice(cursor, r.start));
    parts.push(
      <RNText key={key++} style={italicStyle}>
        {display.slice(r.start, r.end)}
      </RNText>
    );
    cursor = r.end;
  }
  if (cursor < display.length) parts.push(display.slice(cursor));
  return parts;
}

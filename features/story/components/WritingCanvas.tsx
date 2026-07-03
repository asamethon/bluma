import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import React from 'react';
import { NativeSyntheticEvent, StyleSheet, Text, TextInput, TextInputSelectionChangeEventData, View } from 'react-native';

interface WritingCanvasProps {
  storyTitle: string;
  chapterLabel: string;
  chapterTitleValue: string;
  onChangeChapterTitle: (v: string) => void;
  bodyText: string;
  onChangeBodyText: (v: string) => void;
  onSelectionChange: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
}

// Yazma tuvali — bölüm başlığı + gövde metni (imleç takibi dahil)
export function WritingCanvas({
  storyTitle, chapterLabel, chapterTitleValue, onChangeChapterTitle,
  bodyText, onChangeBodyText, onSelectionChange,
}: WritingCanvasProps) {
  const { colors } = useTheme();
  const s = createStyles();

  return (
    <View style={[s.canvas, { backgroundColor: colors.surface, borderColor: colors.border, margin: Spacing.screenX, marginTop: 14 }]}>
      {/* Overline */}
      <Text style={[s.canvasOverline, { color: colors.textLight }]} numberOfLines={1}>
        {storyTitle || 'Başlıksız'} · {chapterLabel}
      </Text>

      {/* Chapter title */}
      <TextInput
        style={[s.chapterTitleInput, { color: colors.text }]}
        value={chapterTitleValue}
        onChangeText={onChangeChapterTitle}
        placeholder="Bölüm başlığı"
        placeholderTextColor={colors.textLight}
        maxLength={80}
      />

      <View style={[s.divider, { backgroundColor: colors.divider }]} />

      {/* Body */}
      <TextInput
        style={[s.bodyInput, { color: colors.text }]}
        value={bodyText}
        onChangeText={onChangeBodyText}
        onSelectionChange={onSelectionChange}
        placeholder="Hikayeni anlatmaya başla…"
        placeholderTextColor={colors.textLight}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    canvas: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: 20,
    },
    canvasOverline: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    chapterTitleInput: {
      fontFamily: Fonts.serif,
      fontSize: 25,
      fontWeight: '700',
      // Kalın serif fontun (Spectral_700Bold) üst çıkıntısı (özellikle Türkçe
      // "İ/Ğ/Ş" gibi aksanlı harflerde) 30'luk lineHeight + padding:0 ile
      // üstten kesiliyordu — oran 25/34'e çıkarıldı (input/component/görsel
      // kalıntısız Text'lerde aynı sorun yok, çünkü onlar padding:0 + tight
      // lineHeight kombinasyonuyla sınırlı değil).
      lineHeight: 34,
      padding: 0,
      paddingTop: 4,
      marginBottom: 4,
    },
    divider: {
      height: 1,
      marginVertical: 14,
    },
    bodyInput: {
      fontFamily: Fonts.serif,
      fontSize: 17,
      lineHeight: 30,
      minHeight: 220,
      padding: 0,
      textAlignVertical: 'top',
    },
  });

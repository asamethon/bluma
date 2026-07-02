import { IconButton } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chapter } from '../hooks/useWriteForm';

interface ChapterTabsProps {
  chapters: Chapter[];
  currentChapterIndex: number;
  writeMode: 'quick' | 'advanced';
  onSelectChapter: (i: number) => void;
  onDeleteChapter: (i: number) => void;
  onAddChapter: () => void;
  autoSaveStatus: 'saved' | 'saving' | null;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

// Header'daki bölüm seçici pill'ler + autosave göstergesi + odak modu düğmesi
export function ChapterTabs({
  chapters, currentChapterIndex, writeMode, onSelectChapter, onDeleteChapter, onAddChapter,
  autoSaveStatus, focusMode, onToggleFocusMode,
}: ChapterTabsProps) {
  const { colors } = useTheme();
  const s = createStyles();

  return (
    <View style={s.header}>
      {/* Chapter picker pill */}
      {writeMode === 'advanced' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, maxHeight: 36 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {chapters.map((ch, i) => (
              <TouchableOpacity
                key={ch.id}
                style={[
                  s.chapterPill,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  currentChapterIndex === i && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => onSelectChapter(i)}
              >
                <Text style={[s.chapterPillText, { color: currentChapterIndex === i ? '#fff' : colors.text }]}>
                  {ch.title}
                </Text>
                {chapters.length > 1 && (
                  <TouchableOpacity onPress={() => onDeleteChapter(i)} hitSlop={4}>
                    <Ionicons name="close" size={13} color={currentChapterIndex === i ? '#fff' : colors.textLight} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[s.addChapterPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={onAddChapter}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={[s.chapterPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={[s.chapterPillText, { color: colors.text }]}>Bölüm 1</Text>
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
          <Text style={[s.autoSaveText, { color: colors.success }]}>
            {autoSaveStatus === 'saving' ? 'Kaydediliyor' : 'Kaydedildi'}
          </Text>
        </View>
      )}

      <IconButton
        icon={focusMode ? 'contract-outline' : 'scan-outline'}
        variant="sunk"
        size={38}
        onPress={onToggleFocusMode}
      />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
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
      borderWidth: 1,
    },
    chapterPillText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '700',
    },
    addChapterPill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
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
    },
  });

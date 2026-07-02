import { CategoryChip, SegmentedControl } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GENRES: StoryCategory[] = [
  'romance', 'fantasy', 'mystery', 'drama',
  'adventure', 'horror', 'comedy', 'poetry', 'sci_fi',
];

interface WritingSetupCardProps {
  writeMode: 'quick' | 'advanced';
  onChangeWriteMode: (mode: 'quick' | 'advanced') => void;
  storyTitle: string;
  onChangeStoryTitle: (v: string) => void;
  storyCategory: StoryCategory;
  onChangeStoryCategory: (c: StoryCategory) => void;
  coverImage: string | null;
  onRemoveCoverImage: () => void;
}

// Hikaye kurulum kartı — başlık, tür seçimi ve kapak resmi thumb'ı
export function WritingSetupCard({
  writeMode, onChangeWriteMode, storyTitle, onChangeStoryTitle,
  storyCategory, onChangeStoryCategory, coverImage, onRemoveCoverImage,
}: WritingSetupCardProps) {
  const { colors } = useTheme();
  const s = createStyles();

  return (
    <View style={[s.setupCard, { backgroundColor: colors.surface, borderColor: colors.border, margin: Spacing.screenX, marginBottom: 0 }]}>
      <SegmentedControl
        options={[
          { value: 'quick', label: 'Hızlı Yaz', icon: 'flash-outline' },
          { value: 'advanced', label: 'Detaylı', icon: 'options-outline' },
        ]}
        value={writeMode}
        onChange={v => onChangeWriteMode(v as 'quick' | 'advanced')}
      />

      {/* Title input */}
      <View style={[s.inputBox, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 16 }]}>
        <Ionicons name="book-outline" size={18} color={storyTitle ? colors.primary : colors.textLight} />
        <TextInput
          style={[s.titleInput, { color: colors.text }]}
          value={storyTitle}
          onChangeText={onChangeStoryTitle}
          placeholder="Hikaye Başlığı"
          placeholderTextColor={colors.textLight}
          maxLength={100}
        />
      </View>
      {storyTitle.length > 0 && (
        <Text style={[s.charCount, { color: colors.textLight }]}>{storyTitle.length}/100</Text>
      )}

      {/* Genre chips */}
      <View style={{ marginTop: 16 }}>
        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>
          Tür <Text style={{ color: colors.error }}>*</Text>
        </Text>
        <View style={s.chipWrap}>
          {GENRES.map(g => (
            <CategoryChip
              key={g}
              category={g}
              active={storyCategory === g}
              onPress={() => onChangeStoryCategory(g)}
            />
          ))}
        </View>
      </View>

      {/* Cover image thumb */}
      {coverImage && (
        <View style={[s.coverRow, { borderTopColor: colors.border }]}>
          <Image source={{ uri: coverImage }} style={s.coverThumb} />
          <TouchableOpacity onPress={onRemoveCoverImage} style={s.coverRemove}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    setupCard: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: 16,
      gap: 0,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 52,
      paddingHorizontal: 14,
      borderRadius: Radius.md,
      borderWidth: 1.5,
    },
    titleInput: {
      flex: 1,
      fontFamily: Fonts.sans,
      fontSize: 16,
    },
    charCount: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      marginTop: 5,
      paddingLeft: 4,
    },
    fieldLabel: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '600',
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
    },
    coverThumb: {
      width: 56,
      height: 80,
      borderRadius: Radius.sm,
    },
    coverRemove: { padding: 2 },
  });

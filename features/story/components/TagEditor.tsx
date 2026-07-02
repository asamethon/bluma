import { Fonts, Radius, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TagEditorProps {
  storyTags: string[];
  onChangeStoryTags: (tags: string[]) => void;
  newTag: string;
  onChangeNewTag: (v: string) => void;
}

// Etiket ekleme satırı + eklenmiş etiket chip'leri
export function TagEditor({ storyTags, onChangeStoryTags, newTag, onChangeNewTag }: TagEditorProps) {
  const { colors } = useTheme();
  const s = createStyles();

  const addTag = () => {
    if (newTag.trim() && !storyTags.includes(newTag.trim()) && storyTags.length < 5) {
      onChangeStoryTags([...storyTags, newTag.trim()]);
      onChangeNewTag('');
    }
  };

  return (
    <>
      <View style={s.tagRow}>
        <TextInput
          style={[s.tagInput, { color: colors.text, borderColor: colors.border }]}
          value={newTag}
          onChangeText={onChangeNewTag}
          placeholder="Etiket ekle"
          placeholderTextColor={colors.textLight}
          onSubmitEditing={addTag}
          maxLength={20}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[s.tagAddBtn, { backgroundColor: colors.primary }, (!newTag.trim() || storyTags.length >= 5) && { opacity: 0.4 }]}
          onPress={addTag}
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
              style={[s.tagChip, { backgroundColor: colors.primarySoft }]}
              onPress={() => onChangeStoryTags(storyTags.filter(x => x !== t))}
            >
              <Text style={[s.tagChipText, { color: colors.primary }]}>#{t}</Text>
              <Ionicons name="close" size={13} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
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
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tagAddBtn: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.pill,
    },
    tagChipText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '600',
    },
  });

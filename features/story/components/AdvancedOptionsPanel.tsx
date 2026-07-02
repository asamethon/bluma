import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TagEditor } from './TagEditor';

interface AdvancedOptionsPanelProps {
  showAdvanced: boolean;
  onToggleShowAdvanced: () => void;
  storyDescription: string;
  onChangeStoryDescription: (v: string) => void;
  storyTags: string[];
  onChangeStoryTags: (tags: string[]) => void;
  newTag: string;
  onChangeNewTag: (v: string) => void;
  isCompleted: boolean;
  onToggleIsCompleted: () => void;
  isMature: boolean;
  onToggleIsMature: () => void;
}

// Gelişmiş seçenekler bloğu — açıklama, etiketler, tamamlandı/18+ toggle'ları
export function AdvancedOptionsPanel({
  showAdvanced, onToggleShowAdvanced, storyDescription, onChangeStoryDescription,
  storyTags, onChangeStoryTags, newTag, onChangeNewTag,
  isCompleted, onToggleIsCompleted, isMature, onToggleIsMature,
}: AdvancedOptionsPanelProps) {
  const { colors } = useTheme();
  const s = createStyles();

  return (
    <View style={{ paddingHorizontal: Spacing.screenX }}>
      <TouchableOpacity
        style={[s.advancedToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onToggleShowAdvanced}
      >
        <Ionicons name={showAdvanced ? 'chevron-up' : 'options-outline'} size={18} color={colors.primary} />
        <Text style={[s.advancedToggleText, { color: colors.primary }]}>
          {showAdvanced ? 'Gelişmiş seçenekleri kapat' : 'Gelişmiş seçenekler'}
        </Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={[s.advancedBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Description */}
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Açıklama</Text>
          <TextInput
            style={[s.descInput, { color: colors.text, borderColor: colors.border }]}
            value={storyDescription}
            onChangeText={onChangeStoryDescription}
            placeholder="Hikaye hakkında kısa bir açıklama…"
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[s.charCount, { color: colors.textLight, textAlign: 'right' }]}>{storyDescription.length}/500</Text>

          {/* Tags */}
          <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Etiketler</Text>
          <TagEditor
            storyTags={storyTags}
            onChangeStoryTags={onChangeStoryTags}
            newTag={newTag}
            onChangeNewTag={onChangeNewTag}
          />

          {/* Completion toggle */}
          <TouchableOpacity
            style={[s.completionRow, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 16 }]}
            onPress={onToggleIsCompleted}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isCompleted ? colors.success : colors.textLight}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.completionTitle, { color: colors.text }]}>Hikaye tamamlandı</Text>
              <Text style={[s.completionSub, { color: colors.textSecondary }]}>
                {isCompleted ? 'Tamamlanmış olarak işaretlendi' : 'Devam ediyor'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Mature content toggle */}
          <TouchableOpacity
            style={[s.completionRow, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 10 }]}
            onPress={onToggleIsMature}
          >
            <Ionicons
              name={isMature ? 'warning' : 'warning-outline'}
              size={22}
              color={isMature ? colors.error : colors.textLight}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.completionTitle, { color: colors.text }]}>Yetişkin içeriği (18+)</Text>
              <Text style={[s.completionSub, { color: colors.textSecondary }]}>
                {isMature ? 'Olgun içerik olarak işaretlendi' : 'Herkese uygun'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      marginTop: 12,
      borderRadius: Radius.lg,
      borderWidth: 1,
    },
    advancedToggleText: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      fontWeight: '600',
    },
    advancedBox: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: 16,
      marginTop: 10,
    },
    descInput: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: 12,
      minHeight: 80,
      lineHeight: 22,
    },
    charCount: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      marginTop: 5,
    },
    fieldLabel: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 10,
    },
    completionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    completionTitle: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      fontWeight: '600',
    },
    completionSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      marginTop: 2,
    },
  });

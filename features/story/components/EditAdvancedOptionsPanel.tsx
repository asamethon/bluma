import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EditChipSelector } from './EditChipSelector';
import { createStyles } from './EditAdvancedOptionsPanel.styles';

interface EditAdvancedOptionsPanelProps {
  storyTags: string[];
  newTag: string;
  setNewTag: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  targetAudiences: { value: string; label: string }[];
  targetAudience: 'all' | 'teen' | 'adult';
  setTargetAudience: (value: 'all' | 'teen' | 'adult') => void;
  languages: string[];
  language: string;
  setLanguage: (value: string) => void;
  commonContentWarnings: string[];
  contentWarnings: string[];
  onAddContentWarning: (warning: string) => void;
  onRemoveContentWarning: (warning: string) => void;
  isCompleted: boolean;
  setIsCompleted: (value: boolean) => void;
}

// Hedef kitle, dil, içerik uyarıları, etiketler ve tamamlanma durumu blokları
// (ana ekranın showAdvancedOptions bloğundan taşındı).
export function EditAdvancedOptionsPanel({
  storyTags,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
  targetAudiences,
  targetAudience,
  setTargetAudience,
  languages,
  language,
  setLanguage,
  commonContentWarnings,
  contentWarnings,
  onAddContentWarning,
  onRemoveContentWarning,
  isCompleted,
  setIsCompleted,
}: EditAdvancedOptionsPanelProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const languageItems = languages.slice(0, 5).map((lang) => ({ value: lang, label: lang }));
  const warningItems = commonContentWarnings.slice(0, 6).map((w) => ({ value: w, label: w }));

  return (
    <View style={styles.advancedOptionsContainer}>

      {/* Tags Section */}
      <View style={styles.advancedSection}>
        <Text style={styles.advancedSectionTitle}>🏷️ Etiketler</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagAdvancedInput}
            placeholder="Etiket ekle..."
            placeholderTextColor={colors.textSecondary}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={onAddTag}
            maxLength={20}
          />
          <TouchableOpacity
            style={[styles.tagAddButton, (!newTag.trim() || storyTags.length >= 5) && styles.tagAddButtonDisabled]}
            onPress={onAddTag}
            disabled={!newTag.trim() || storyTags.length >= 5}
          >
            <Ionicons name="add" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {storyTags.length > 0 && (
          <View style={styles.tagsDisplay}>
            {storyTags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag}</Text>
                <TouchableOpacity
                  style={styles.tagRemoveButton}
                  onPress={() => onRemoveTag(tag)}
                >
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Target Audience */}
      <View style={styles.advancedSection}>
        <Text style={styles.advancedSectionTitle}>👥 Hedef Kitle</Text>
        <EditChipSelector
          items={targetAudiences as { value: 'all' | 'teen' | 'adult'; label: string }[]}
          selectedValue={targetAudience}
          onSelect={setTargetAudience}
          styles={styles}
        />
      </View>

      {/* Language Selection */}
      <View style={styles.advancedSection}>
        <Text style={styles.advancedSectionTitle}>🌍 Dil</Text>
        <EditChipSelector
          items={languageItems}
          selectedValue={language}
          onSelect={setLanguage}
          styles={styles}
        />
      </View>

      {/* Content Warnings */}
      <View style={styles.advancedSection}>
        <Text style={styles.advancedSectionTitle}>⚠️ İçerik Uyarıları</Text>
        <EditChipSelector
          items={warningItems}
          selectedValue={contentWarnings}
          onSelect={(warning) => {
            if (contentWarnings.includes(warning)) {
              onRemoveContentWarning(warning);
            } else {
              onAddContentWarning(warning);
            }
          }}
          styles={styles}
        />
      </View>

      {/* Completion Toggle */}
      <View style={styles.advancedSection}>
        <TouchableOpacity
          style={styles.completionAdvancedToggle}
          onPress={() => setIsCompleted(!isCompleted)}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={isCompleted ? colors.success : colors.textSecondary}
          />
          <View style={styles.completionAdvancedContent}>
            <Text style={[styles.completionAdvancedTitle, isCompleted && styles.completionAdvancedTitleActive]}>
              Hikaye Tamamlandı
            </Text>
            <Text style={styles.completionAdvancedSubtitle}>
              {isCompleted ? 'Hikaye artık tamamlanmış olarak işaretlendi' : 'Hikaye henüz devam ediyor'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

    </View>
  );
}

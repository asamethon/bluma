import { useTheme } from '@/constants/theme';
import { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedFloatingInput } from './AnimatedFloatingInput';
import { createSharedStyles } from './editSharedStyles';
import { EditCoverSection } from './EditCoverSection';
import { EditModeToggle } from './EditModeToggle';
import { createStyles } from './EditQuickWriteForm.styles';

interface EditQuickWriteFormProps {
  writeMode: 'quick' | 'advanced';
  modeTabAnim: Animated.Value;
  onModeChange: (mode: 'quick' | 'advanced') => void;
  coverImage: string | null;
  showCoverModal: boolean;
  setShowCoverModal: (show: boolean) => void;
  onPickCoverImage: () => void;
  onTakeCoverPhoto: () => void;
  storyTitle: string;
  setStoryTitle: (value: string) => void;
  titleLabelAnim: Animated.Value;
  storyContent: string;
  setStoryContent: (value: string) => void;
  contentLabelAnim: Animated.Value;
  focusedInput: string | null;
  onInputFocus: (inputName: string, animValue: Animated.Value) => void;
  onInputBlur: (inputName: string, animValue: Animated.Value, value: string) => void;
  validation: { isValid: boolean; titleValid: boolean; contentValid: boolean };
  getWordCount: (text: string) => number;
  getReadingTime: (text: string) => number;
  keyboardHeight: number;
  categories: { value: StoryCategory; label: string }[];
  storyCategory: StoryCategory;
  setStoryCategory: (value: StoryCategory) => void;
  showAdvancedOptions: boolean;
  toggleAdvancedOptions: () => void;
}

// "Hızlı Yaz" modunun tüm form içeriği (renderQuickWriteMode'dan taşındı).
export function EditQuickWriteForm({
  writeMode,
  modeTabAnim,
  onModeChange,
  coverImage,
  showCoverModal,
  setShowCoverModal,
  onPickCoverImage,
  onTakeCoverPhoto,
  storyTitle,
  setStoryTitle,
  titleLabelAnim,
  storyContent,
  setStoryContent,
  contentLabelAnim,
  focusedInput,
  onInputFocus,
  onInputBlur,
  validation,
  getWordCount,
  getReadingTime,
  keyboardHeight,
  categories,
  storyCategory,
  setStoryCategory,
  showAdvancedOptions,
  toggleAdvancedOptions,
}: EditQuickWriteFormProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const shared = createSharedStyles(colors);
  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={styles.quickWriteContainer}>
      <EditModeToggle writeMode={writeMode} modeTabAnim={modeTabAnim} onModeChange={onModeChange} />

      <EditCoverSection
        coverImage={coverImage}
        showCoverModal={showCoverModal}
        setShowCoverModal={setShowCoverModal}
        onPickImage={onPickCoverImage}
        onTakePhoto={onTakeCoverPhoto}
      />

      {/* Title Input with animated floating label */}
      <AnimatedFloatingInput
        label="Hikaye Başlığı"
        value={storyTitle}
        onChangeText={setStoryTitle}
        animValue={titleLabelAnim}
        focused={focusedInput === 'title'}
        onFocus={() => onInputFocus('title', titleLabelAnim)}
        onBlur={() => onInputBlur('title', titleLabelAnim, storyTitle)}
        maxLength={100}
        isError={!validation.titleValid && storyTitle.length > 0}
        inputStyle={styles.titleInput}
        topExpanded={18}
        footer={
          <View style={shared.inputMeta}>
            <Text style={[
              shared.inputValidation,
              validation.titleValid ? shared.validationSuccess : shared.validationError
            ]}>
              {storyTitle.length >= 3 ? '✓ Başlık uygun' : 'En az 3 karakter gerekli'}
            </Text>
            <Text style={shared.characterCount}>{storyTitle.length}/100</Text>
          </View>
        }
      />

      {/* Content Input with animated floating label */}
      <AnimatedFloatingInput
        label="Hikayeni Yaz"
        value={storyContent}
        onChangeText={setStoryContent}
        animValue={contentLabelAnim}
        focused={focusedInput === 'content'}
        onFocus={() => onInputFocus('content', contentLabelAnim)}
        onBlur={() => onInputBlur('content', contentLabelAnim, storyContent)}
        multiline
        isError={!validation.contentValid && storyContent.length > 0}
        containerStyle={{ flex: 1 }}
        inputStyle={[styles.contentInput, { height: Math.max(200, screenHeight * 0.3 - keyboardHeight / 2) }]}
        topExpanded={22}
        footer={
          <View style={shared.inputMeta}>
            <View style={shared.contentStats}>
              <Text style={shared.statText}>
                📝 {getWordCount(storyContent)} kelime
              </Text>
              <Text style={shared.statText}>
                ⏱️ {getReadingTime(storyContent)} dk okuma
              </Text>
            </View>
            <Text style={[
              shared.inputValidation,
              validation.contentValid ? shared.validationSuccess : shared.validationError
            ]}>
              {storyContent.length >= 50 ? '✓ İçerik yeterli' : `${50 - storyContent.length} karakter daha`}
            </Text>
          </View>
        }
      />

      {/* Quick Category Selection */}
      <View style={shared.quickCategoryContainer}>
        <Text style={shared.quickCategoryLabel}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={shared.quickCategoryScroll}>
          {categories.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                shared.quickCategoryChip,
                storyCategory === cat.value && shared.quickCategoryChipActive
              ]}
              onPress={() => setStoryCategory(cat.value)}
            >
              <Text style={[
                shared.quickCategoryChipText,
                storyCategory === cat.value && shared.quickCategoryChipTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Advanced Options Toggle */}
      <TouchableOpacity
        style={shared.advancedToggle}
        onPress={toggleAdvancedOptions}
      >
        <Ionicons
          name={showAdvancedOptions ? "chevron-up" : "options"}
          size={20}
          color={colors.primary}
        />
        <Text style={shared.advancedToggleText}>
          {showAdvancedOptions ? 'Gelişmiş Seçenekleri Gizle' : 'Gelişmiş Seçenekler'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { EditAdvancedOptionsPanel } from '@/features/story/components/EditAdvancedOptionsPanel';
import { EditAdvancedWriteForm } from '@/features/story/components/EditAdvancedWriteForm';
import { EditLoadingOverlay } from '@/features/story/components/EditLoadingOverlay';
import { EditQuickWriteForm } from '@/features/story/components/EditQuickWriteForm';
import { EditScreenHeader } from '@/features/story/components/EditScreenHeader';
import { useEditStoryForm } from '@/features/story/hooks/useEditStoryForm';
import { observer } from '@legendapp/state/react';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default observer(function StoryEditScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const form = useEditStoryForm(id);
  const styles = createStyles(colors);

  const validation = form.getQuickFormValidation();

  // Show loading screen while fetching story
  if (form.isLoadingStory) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Hikaye yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  // If no story data, show error
  if (!form.storyData) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Hikaye bulunamadı</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => form.router.back()}>
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <EditScreenHeader
        autoSaveStatus={form.autoSaveStatus}
        onBack={() => form.router.back()}
        onUpdate={form.handleUpdateStory}
        isUpdateDisabled={!validation.isValid}
        isLoading={form.isLoading}
      />

      {/* Main Content */}
      <ScrollView
        style={[styles.scrollView, { paddingBottom: form.keyboardHeight }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {form.writeMode === 'quick' ? (
          <EditQuickWriteForm
            writeMode={form.writeMode}
            modeTabAnim={form.modeTabAnim}
            onModeChange={form.handleModeChange}
            coverImage={form.coverImage}
            showCoverModal={form.showCoverModal}
            setShowCoverModal={form.setShowCoverModal}
            onPickCoverImage={form.handlePickCoverImage}
            onTakeCoverPhoto={form.handleTakeCoverPhoto}
            storyTitle={form.storyTitle}
            setStoryTitle={form.setStoryTitle}
            titleLabelAnim={form.titleLabelAnim}
            storyContent={form.storyContent}
            setStoryContent={form.setStoryContent}
            contentLabelAnim={form.contentLabelAnim}
            focusedInput={form.focusedInput}
            onInputFocus={form.handleInputFocus}
            onInputBlur={form.handleInputBlur}
            validation={validation}
            getWordCount={form.getWordCount}
            getReadingTime={form.getReadingTime}
            keyboardHeight={form.keyboardHeight}
            categories={form.categories}
            storyCategory={form.storyCategory}
            setStoryCategory={form.setStoryCategory}
            showAdvancedOptions={form.showAdvancedOptions}
            toggleAdvancedOptions={form.toggleAdvancedOptions}
          />
        ) : (
          <EditAdvancedWriteForm
            writeMode={form.writeMode}
            modeTabAnim={form.modeTabAnim}
            onModeChange={form.handleModeChange}
            coverImage={form.coverImage}
            showCoverModal={form.showCoverModal}
            setShowCoverModal={form.setShowCoverModal}
            onPickCoverImage={form.handlePickCoverImage}
            onTakeCoverPhoto={form.handleTakeCoverPhoto}
            storyTitle={form.storyTitle}
            setStoryTitle={form.setStoryTitle}
            titleLabelAnim={form.titleLabelAnim}
            storyDescription={form.storyDescription}
            setStoryDescription={form.setStoryDescription}
            descriptionLabelAnim={form.descriptionLabelAnim}
            focusedInput={form.focusedInput}
            onInputFocus={form.handleInputFocus}
            onInputBlur={form.handleInputBlur}
            validation={validation}
            chapters={form.chapters}
            currentChapterIndex={form.currentChapterIndex}
            setCurrentChapterIndex={form.setCurrentChapterIndex}
            onAddChapter={form.handleAddChapter}
            onUpdateChapter={form.handleUpdateChapter}
            onDeleteChapter={form.handleDeleteChapter}
            chapterTitleLabelAnim={form.chapterTitleLabelAnim}
            chapterContentLabelAnim={form.chapterContentLabelAnim}
            getWordCount={form.getWordCount}
            getReadingTime={form.getReadingTime}
            calculateTotalReadingTime={form.calculateTotalReadingTime}
            categories={form.categories}
            storyCategory={form.storyCategory}
            setStoryCategory={form.setStoryCategory}
            showAdvancedOptions={form.showAdvancedOptions}
            toggleAdvancedOptions={form.toggleAdvancedOptions}
          />
        )}

        {/* Advanced Options (when toggled) */}
        {form.showAdvancedOptions && (
          <EditAdvancedOptionsPanel
            storyTags={form.storyTags}
            newTag={form.newTag}
            setNewTag={form.setNewTag}
            onAddTag={form.handleAddTag}
            onRemoveTag={form.handleRemoveTag}
            targetAudiences={form.targetAudiences}
            targetAudience={form.targetAudience}
            setTargetAudience={form.setTargetAudience}
            languages={form.languages}
            language={form.language}
            setLanguage={form.setLanguage}
            commonContentWarnings={form.commonContentWarnings}
            contentWarnings={form.contentWarnings}
            onAddContentWarning={form.handleAddContentWarning}
            onRemoveContentWarning={form.handleRemoveContentWarning}
            isCompleted={form.isCompleted}
            setIsCompleted={form.setIsCompleted}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modern Loading Overlay */}
      {form.isLoading && <EditLoadingOverlay />}
    </Screen>
  );
});

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    bottomSpacer: {
      height: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 18,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 20,
    },
    backButton: {
      padding: 4,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
  });

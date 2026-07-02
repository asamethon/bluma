import { Screen } from '@/components/ui';
import { Fonts, useTheme } from '@/constants/theme';
import { AdvancedOptionsPanel } from '@/features/story/components/AdvancedOptionsPanel';
import { ChapterTabs } from '@/features/story/components/ChapterTabs';
import { CoverPickerSheet } from '@/features/story/components/CoverPickerSheet';
import { StoryPreviewModal } from '@/features/story/components/StoryPreviewModal';
import { WritingBottomBar } from '@/features/story/components/WritingBottomBar';
import { WritingCanvas } from '@/features/story/components/WritingCanvas';
import { WritingSetupCard } from '@/features/story/components/WritingSetupCard';
import { useWriteForm } from '@/features/story/hooks/useWriteForm';
import { observer } from '@legendapp/state/react';
import React from 'react';
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default observer(function WriteScreen() {
  const { colors } = useTheme();
  const { bottom: safeBottom } = useSafeAreaInsets();
  // Tab bar: 64px bar + safe area bottom padding (minimum 10px)
  const TAB_BAR_HEIGHT = 64 + Math.max(safeBottom, 10);

  const f = useWriteForm();
  const s = createStyles(colors);

  return (
    <Screen style={s.root}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <ChapterTabs
        chapters={f.chapters}
        currentChapterIndex={f.currentChapterIndex}
        writeMode={f.writeMode}
        onSelectChapter={f.setCurrentChapterIndex}
        onDeleteChapter={f.handleDeleteChapter}
        onAddChapter={f.handleAddChapter}
        autoSaveStatus={f.autoSaveStatus}
        focusMode={f.focusMode}
        onToggleFocusMode={() => f.setFocusMode(v => !v)}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        {/* ── Story setup card ───────────────────────────────────── */}
        {!f.focusMode && (
          <WritingSetupCard
            writeMode={f.writeMode}
            onChangeWriteMode={f.setWriteMode}
            storyTitle={f.storyTitle}
            onChangeStoryTitle={f.setStoryTitle}
            storyCategory={f.storyCategory}
            onChangeStoryCategory={f.setStoryCategory}
            coverImage={f.coverImage}
            onRemoveCoverImage={() => f.setCoverImage(null)}
          />
        )}

        {/* ── Writing canvas ─────────────────────────────────────── */}
        <WritingCanvas
          storyTitle={f.storyTitle}
          chapterLabel={f.writeMode === 'quick' ? 'Bölüm 1' : f.curChapter?.title || 'Bölüm 1'}
          chapterTitleValue={f.writeMode === 'quick' ? f.chapterTitle : f.curChapter?.title ?? ''}
          onChangeChapterTitle={v => f.writeMode === 'quick' ? f.setChapterTitle(v) : f.updateChapter(f.currentChapterIndex, 'title', v)}
          bodyText={f.bodyText}
          onChangeBodyText={f.setBodyText}
          onSelectionChange={e => f.setBodySel(e.nativeEvent.selection)}
        />

        {/* ── Advanced options ───────────────────────────────────── */}
        {f.writeMode === 'advanced' && (
          <AdvancedOptionsPanel
            showAdvanced={f.showAdvanced}
            onToggleShowAdvanced={() => f.setShowAdvanced(v => !v)}
            storyDescription={f.storyDescription}
            onChangeStoryDescription={f.setStoryDescription}
            storyTags={f.storyTags}
            onChangeStoryTags={f.setStoryTags}
            newTag={f.newTag}
            onChangeNewTag={f.setNewTag}
            isCompleted={f.isCompleted}
            onToggleIsCompleted={() => f.setIsCompleted(v => !v)}
            isMature={f.isMature}
            onToggleIsMature={() => f.setIsMature(v => !v)}
          />
        )}
      </ScrollView>

      {/* ── Sticky bottom bar ──────────────────────────────────────── */}
      <WritingBottomBar
        wordCount={f.wordCount}
        charCount={f.charCount}
        readMin={f.readMin}
        onOpenCoverSheet={() => f.setCoverSheetVisible(true)}
        onInsertBullet={() => f.insertAtCursor('\n• ')}
        onInsertSceneBreak={() => f.insertAtCursor('\n\n* * *\n\n')}
        onInsertParagraph={() => f.insertAtCursor('\n\n')}
        onPreview={() => { Keyboard.dismiss(); f.setPreviewVisible(true); }}
        onPublish={f.handlePublish}
        isValid={f.isValid}
        isLoading={f.isLoading}
        paddingBottom={TAB_BAR_HEIGHT + 12}
      />

      {/* ── Cover image bottom sheet ────────────────────────────────── */}
      <CoverPickerSheet
        visible={f.coverSheetVisible}
        onClose={() => f.setCoverSheetVisible(false)}
        onPickGallery={f.handlePickCover}
        onTakePhoto={f.handleTakePhoto}
        safeBottom={safeBottom}
      />

      {/* ── Reader preview ──────────────────────────────────────────── */}
      <StoryPreviewModal
        visible={f.previewVisible}
        onClose={() => f.setPreviewVisible(false)}
        coverImage={f.coverImage}
        chapterTitle={f.chapterTitle}
        storyTitle={f.storyTitle}
        authorName={f.currentUser?.displayName || f.currentUser?.username || 'Sen'}
        writeMode={f.writeMode}
        chapters={f.chapters}
        storyContent={f.storyContent}
        curChapterTitle={f.curChapter?.title}
        onSaveDraft={f.handleSaveDraft}
        onPublish={f.handlePublish}
        isLoading={f.isLoading}
        safeBottom={safeBottom}
      />

      {/* Loading overlay */}
      {f.isLoading && (
        <View style={s.loadingOverlay}>
          <View style={[s.loadingBox, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[s.loadingText, { color: colors.text }]}>Kaydediliyor…</Text>
          </View>
        </View>
      )}
    </Screen>
  );
});

const createStyles = (colors: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    // Loading
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingBox: {
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      gap: 14,
    },
    loadingText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      fontWeight: '600',
    },
  });

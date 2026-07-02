import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EditChapter } from '../hooks/useEditStoryForm';
import { AnimatedFloatingInput } from './AnimatedFloatingInput';
import { createSharedStyles } from './editSharedStyles';
import { createStyles } from './EditAdvancedWriteForm.styles';

interface EditChaptersSectionProps {
  chapters: EditChapter[];
  currentChapterIndex: number;
  setCurrentChapterIndex: (index: number) => void;
  onAddChapter: () => void;
  onUpdateChapter: (index: number, field: 'title' | 'content', value: string) => void;
  onDeleteChapter: (index: number) => void;
  focusedInput: string | null;
  onInputFocus: (inputName: string, animValue: Animated.Value) => void;
  onInputBlur: (inputName: string, animValue: Animated.Value, value: string) => void;
  chapterTitleLabelAnim: Animated.Value;
  chapterContentLabelAnim: Animated.Value;
  getWordCount: (text: string) => number;
  getReadingTime: (text: string) => number;
  calculateTotalReadingTime: () => number;
}

// Detaylı yazma modundaki bölüm navigasyonu + aktif bölüm editörü
// (EditAdvancedWriteForm'un "Chapters Section" bloğundan taşındı).
export function EditChaptersSection({
  chapters,
  currentChapterIndex,
  setCurrentChapterIndex,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  focusedInput,
  onInputFocus,
  onInputBlur,
  chapterTitleLabelAnim,
  chapterContentLabelAnim,
  getWordCount,
  getReadingTime,
  calculateTotalReadingTime,
}: EditChaptersSectionProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const shared = createSharedStyles(colors);
  const screenHeight = Dimensions.get('window').height;
  const currentChapter = chapters[currentChapterIndex];

  return (
    <View style={styles.chaptersSection}>
      <View style={styles.chaptersSectionHeader}>
        <Text style={styles.chaptersSectionTitle}>📚 Bölümler</Text>
        <TouchableOpacity
          style={styles.addChapterBtn}
          onPress={onAddChapter}
        >
          <Ionicons name="add" size={16} color={colors.white} />
          <Text style={styles.addChapterBtnText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Chapter Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapterNavScroll}>
        {chapters.map((chapter, index) => (
          <TouchableOpacity
            key={chapter.id}
            style={[
              styles.chapterNavTab,
              currentChapterIndex === index && styles.chapterNavTabActive
            ]}
            onPress={() => setCurrentChapterIndex(index)}
          >
            <Text style={[
              styles.chapterNavTabText,
              currentChapterIndex === index && styles.chapterNavTabTextActive
            ]}>
              {chapter.title}
            </Text>
            {chapters.length > 1 && (
              <TouchableOpacity
                style={styles.deleteChapterBtn}
                onPress={() => onDeleteChapter(index)}
              >
                <Ionicons name="close" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Chapter Editor */}
      <View style={styles.chapterEditor}>
        <AnimatedFloatingInput
          label="Bölüm Başlığı"
          value={currentChapter.title}
          onChangeText={(value) => onUpdateChapter(currentChapterIndex, 'title', value)}
          animValue={chapterTitleLabelAnim}
          focused={focusedInput === 'chapterTitle'}
          onFocus={() => onInputFocus('chapterTitle', chapterTitleLabelAnim)}
          onBlur={() => onInputBlur('chapterTitle', chapterTitleLabelAnim, currentChapter.title)}
          maxLength={100}
          inputStyle={styles.chapterTitleInput}
          topExpanded={18}
        />

        <AnimatedFloatingInput
          label="Bölüm İçeriği"
          value={currentChapter.content}
          onChangeText={(value) => onUpdateChapter(currentChapterIndex, 'content', value)}
          animValue={chapterContentLabelAnim}
          focused={focusedInput === 'chapterContent'}
          onFocus={() => onInputFocus('chapterContent', chapterContentLabelAnim)}
          onBlur={() => onInputBlur('chapterContent', chapterContentLabelAnim, currentChapter.content)}
          multiline
          containerStyle={{ flex: 1 }}
          inputStyle={[styles.chapterContentInput, { height: Math.max(200, screenHeight * 0.25) }]}
          topExpanded={22}
          footer={
            <View style={shared.inputMeta}>
              <View style={shared.contentStats}>
                <Text style={shared.statText}>
                  📝 {getWordCount(currentChapter.content)} kelime
                </Text>
                <Text style={shared.statText}>
                  ⏱️ {getReadingTime(currentChapter.content)} dk okuma
                </Text>
                <Text style={shared.statText}>
                  📚 Toplam: {calculateTotalReadingTime()} dk
                </Text>
              </View>
            </View>
          }
        />
      </View>
    </View>
  );
}

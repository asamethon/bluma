import { Button } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chapter } from '../hooks/useWriteForm';
import { StoryImage } from './StoryImage';
import { parseImageToken } from '../utils/imageToken';

interface StoryPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  coverImage: string | null;
  chapterTitle: string;
  storyTitle: string;
  authorName: string;
  writeMode: 'quick' | 'advanced';
  chapters: Chapter[];
  storyContent: string;
  curChapterTitle?: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  isLoading: boolean;
  safeBottom: number;
}

// Okuyucu önizleme ekranı — yayınlamadan önce hikayenin nasıl görüneceğini gösterir
export function StoryPreviewModal({
  visible, onClose, coverImage, chapterTitle, storyTitle, authorName,
  writeMode, chapters, storyContent, curChapterTitle, onSaveDraft, onPublish, isLoading, safeBottom,
}: StoryPreviewModalProps) {
  const { colors } = useTheme();
  const s = createStyles();

  const displayChapters = writeMode === 'quick'
    ? [{ title: chapterTitle, content: storyContent }]
    : chapters;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[s.previewHeader, { paddingTop: safeBottom + 44, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={s.toolBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.previewHeaderTitle, { color: colors.textSecondary }]}>Önizleme</Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 80 }}>
          {coverImage && (
            <Image source={{ uri: coverImage }} style={s.previewCover} resizeMode="cover" />
          )}
          <Text style={[s.previewKicker, { color: colors.primary }]}>
            {(curChapterTitle || chapterTitle || 'Bölüm 1').toUpperCase()}
          </Text>
          <Text style={[s.previewTitle, { color: colors.text }]}>{storyTitle || 'Başlıksız'}</Text>
          <Text style={[s.previewAuthor, { color: colors.textSecondary }]}>
            {authorName}
          </Text>
          <View style={[s.divider, { backgroundColor: colors.divider, marginVertical: 18 }]} />
          {displayChapters.map((ch, ci) => {
            const paras = (ch.content || '').split('\n\n').filter(p => p.trim());
            return (
              <View key={ci} style={{ marginBottom: 28 }}>
                {writeMode === 'advanced' && (
                  <Text style={[s.previewChapterTitle, { color: colors.text }]}>
                    {ch.title || `Bölüm ${ci + 1}`}
                  </Text>
                )}
                {paras.length > 0 ? paras.map((p, pi) => {
                  const imageUrl = parseImageToken(p);
                  if (imageUrl) return <StoryImage key={pi} uri={imageUrl} />;
                  return <Text key={pi} style={[s.previewBody, { color: colors.text }]}>{p}</Text>;
                }) : (
                  <Text style={[s.previewBody, { color: colors.textLight, fontStyle: 'italic' }]}>
                    Bu bölümde henüz içerik yok.
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Preview footer — review & act */}
        <View style={[s.bottomBar, { borderTopColor: colors.border, paddingBottom: safeBottom + 14 }]}>
          <View style={s.actionRow}>
            <Button
              label="Taslak Kaydet"
              variant="secondary"
              size="md"
              icon="save-outline"
              onPress={() => { onClose(); onSaveDraft(); }}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <Button
              label="Yayınla"
              variant="primary"
              size="md"
              iconRight="arrow-forward"
              onPress={() => { onClose(); onPublish(); }}
              disabled={isLoading}
              style={{ flex: 1.4 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = () =>
  StyleSheet.create({
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenX,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    previewHeaderTitle: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    toolBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.sm,
    },
    previewCover: {
      width: '100%',
      height: 200,
      borderRadius: Radius.lg,
      marginBottom: 18,
    },
    previewKicker: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      marginBottom: 8,
    },
    previewTitle: {
      fontFamily: Fonts.serif,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    previewAuthor: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 8,
    },
    divider: {
      height: 1,
    },
    previewChapterTitle: {
      fontFamily: Fonts.serif,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 12,
    },
    previewBody: {
      fontFamily: Fonts.serif,
      fontSize: 18,
      lineHeight: 30,
      marginBottom: 14,
    },
    bottomBar: {
      backgroundColor: undefined,
      borderTopWidth: 1,
      paddingHorizontal: Spacing.screenX,
      paddingTop: 12,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
  });

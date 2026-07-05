import { Button } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WritingBottomBarProps {
  wordCount: number;
  charCount: number;
  readMin: number;
  onOpenCoverSheet: () => void;
  onInsertBullet: () => void;
  onInsertSceneBreak: () => void;
  onInsertParagraph: () => void;
  onInsertImage: () => void;
  imageUploading: boolean;
  onPreview: () => void;
  onPublish: () => void;
  isValid: boolean;
  isLoading: boolean;
  paddingBottom: number;
}

// Yazma ekranının alt sabit çubuğu — kelime sayacı, biçim araçları, aksiyon butonları
export function WritingBottomBar({
  wordCount, charCount, readMin, onOpenCoverSheet, onInsertBullet, onInsertSceneBreak,
  onInsertParagraph, onInsertImage, imageUploading, onPreview, onPublish, isValid, isLoading, paddingBottom,
}: WritingBottomBarProps) {
  const { colors } = useTheme();
  const s = createStyles();

  return (
    <View style={[s.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom }]}>
      {/* Stats row */}
      <View style={s.statsRow}>
        <Text style={[s.statMain, { color: colors.text }]}>{wordCount.toLocaleString('tr-TR')}</Text>
        <Text style={[s.statSub, { color: colors.textSecondary }]}> kelime</Text>
        <View style={{ flex: 1 }} />
        <Text style={[s.statMeta, { color: colors.textLight }]}>{charCount} karakter · ~{readMin} dk okuma</Text>
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        <TouchableOpacity style={s.toolBtn} onPress={onOpenCoverSheet}>
          <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {/* Madde işareti satırı */}
        <TouchableOpacity style={s.toolBtn} onPress={onInsertBullet}>
          <Ionicons name="list-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {/* Sahne ayıracı */}
        <TouchableOpacity style={s.toolBtn} onPress={onInsertSceneBreak}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {/* Yeni paragraf */}
        <TouchableOpacity style={s.toolBtn} onPress={onInsertParagraph}>
          <Ionicons name="return-down-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {/* Hikaye içine resim ekle — kapak resminden ayrı, imlece eklenir */}
        <TouchableOpacity style={s.toolBtn} onPress={onInsertImage} disabled={imageUploading}>
          {imageUploading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Ionicons name="images-outline" size={22} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={s.actionRow}>
        <Button
          label="Önizle"
          variant="secondary"
          size="md"
          icon="eye-outline"
          onPress={onPreview}
          disabled={!isValid || isLoading}
          style={{ flex: 1 }}
        />
        <Button
          label="Yayınla"
          variant="primary"
          size="md"
          iconRight="arrow-forward"
          onPress={onPublish}
          disabled={!isValid || isLoading}
          style={{ flex: 1.4 }}
        />
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderTopWidth: 1,
      paddingHorizontal: Spacing.screenX,
      paddingTop: 12,
      paddingBottom: 20,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 10,
    },
    statMain: {
      fontFamily: Fonts.serif,
      fontSize: 20,
      fontWeight: '700',
    },
    statSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      fontWeight: '600',
    },
    statMeta: {
      fontFamily: Fonts.sans,
      fontSize: 12,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginBottom: 10,
    },
    toolBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.sm,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
  });

import { Fonts, Radius , useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CoverPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onTakePhoto: () => void;
  safeBottom: number;
}

export function CoverPickerSheet({ visible, onClose, onPickGallery, onTakePhoto, safeBottom }: CoverPickerSheetProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const s = createStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.sheetRoot}>
        <Pressable style={s.sheetBackdrop} onPress={onClose} />
        <View style={[s.sheetContent, { backgroundColor: colors.surface, paddingBottom: safeBottom + 16 }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.modalTitle, { color: colors.text }]}>{t('coverPicker.title')}</Text>
          <Text style={[s.modalSub, { color: colors.textSecondary }]}>{t('coverPicker.subtitle')}</Text>

          <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => { onClose(); onPickGallery(); }}>
            <View style={[s.modalIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="images" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.modalBtnText, { color: colors.text }]}>{t('coverPicker.gallery')}</Text>
              <Text style={[s.modalBtnSub, { color: colors.textSecondary }]}>{t('coverPicker.gallerySub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => { onClose(); onTakePhoto(); }}>
            <View style={[s.modalIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="camera" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.modalBtnText, { color: colors.text }]}>{t('coverPicker.camera')}</Text>
              <Text style={[s.modalBtnSub, { color: colors.textSecondary }]}>{t('coverPicker.cameraSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={[s.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = () =>
  StyleSheet.create({
    sheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheetContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 2,
      marginBottom: 14,
    },
    modalTitle: {
      fontFamily: Fonts.serif,
      fontSize: 20, lineHeight: 28,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 6,
    },
    modalSub: {
      fontFamily: Fonts.sans,
      fontSize: 14, lineHeight: 18,
      textAlign: 'center',
      marginBottom: 22,
    },
    modalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.lg,
      borderWidth: 1,
      marginBottom: 10,
    },
    modalIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnText: {
      fontFamily: Fonts.sans,
      fontSize: 15, lineHeight: 20,
      fontWeight: '600',
    },
    modalBtnSub: {
      fontFamily: Fonts.sans,
      fontSize: 12, lineHeight: 16,
      marginTop: 2,
    },
    cancelBtn: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelText: {
      fontFamily: Fonts.sans,
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
    },
  });

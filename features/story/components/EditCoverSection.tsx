import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { createStyles } from './EditCoverSection.styles';

interface EditCoverSectionProps {
  coverImage: string | null;
  showCoverModal: boolean;
  setShowCoverModal: (show: boolean) => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
}

// Kapak resmi seçim alanı + bu ekrana özgü kapak seçim modalı.
// (write.tsx'in yeni CoverPickerSheet'i bilerek kullanılmıyor — bu ekran kendi eski görünümünü koruyor.)
export function EditCoverSection({
  coverImage,
  showCoverModal,
  setShowCoverModal,
  onPickImage,
  onTakePhoto,
}: EditCoverSectionProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <>
      <View style={styles.coverSection}>
        <Text style={styles.coverSectionLabel}>📷 Hikaye Kapağı</Text>
        <TouchableOpacity
          style={styles.coverSelectButton}
          onPress={() => setShowCoverModal(true)}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverThumbnail} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.coverPlaceholderText}>Kapak Ekle</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modern Cover Image Modal */}
      <Modal
        visible={showCoverModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCoverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modernModalContent}>
            <Text style={styles.modernModalTitle}>📷 Kapak Resmi Ekle</Text>
            <Text style={styles.modernModalSubtitle}>
              Hikayen için görsel bir kapak seç
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modernModalButton}
                onPress={() => {
                  setShowCoverModal(false);
                  onPickImage();
                }}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="images" size={24} color={colors.primary} />
                </View>
                <View style={styles.modalButtonContent}>
                  <Text style={styles.modernModalButtonText}>Galeriden Seç</Text>
                  <Text style={styles.modernModalButtonSubtext}>Mevcut fotoğraflarından seç</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modernModalButton}
                onPress={() => {
                  setShowCoverModal(false);
                  onTakePhoto();
                }}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="camera" size={24} color={colors.primary} />
                </View>
                <View style={styles.modalButtonContent}>
                  <Text style={styles.modernModalButtonText}>Fotoğraf Çek</Text>
                  <Text style={styles.modernModalButtonSubtext}>Yeni bir fotoğraf çek</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modernModalCancelButton}
              onPress={() => setShowCoverModal(false)}
            >
              <Text style={styles.modernModalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

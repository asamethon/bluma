import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EditScreenHeaderProps {
  autoSaveStatus: 'saved' | 'saving' | 'error' | null;
  onBack: () => void;
  onUpdate: () => void;
  isUpdateDisabled: boolean;
  isLoading: boolean;
}

// Düzenleme ekranının üst başlık çubuğu: geri butonu, başlık, auto-save
// göstergesi ve "Güncelle" aksiyon butonu.
export function EditScreenHeader({
  autoSaveStatus,
  onBack,
  onUpdate,
  isUpdateDisabled,
  isLoading,
}: EditScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.modernHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>✍️ Hikayeyi Düzenle</Text>
          </View>
          {autoSaveStatus && (
            <View style={styles.autoSaveIndicator}>
              {autoSaveStatus === 'saving' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={autoSaveStatus === 'saved' ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={autoSaveStatus === 'saved' ? colors.success : colors.error}
                />
              )}
              <Text style={[
                styles.autoSaveText,
                { color: autoSaveStatus === 'saved' ? colors.success : autoSaveStatus === 'error' ? colors.error : colors.primary }
              ]}>
                {autoSaveStatus === 'saving' ? 'Kaydediliyor...' :
                 autoSaveStatus === 'saved' ? 'Kaydedildi' : 'Hata'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.updateButton, isUpdateDisabled && styles.actionButtonDisabled]}
            onPress={onUpdate}
            disabled={isUpdateDisabled || isLoading}
          >
            <Ionicons name="checkmark-outline" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Güncelle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    modernHeader: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: 8,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    backButton: {
      padding: 4,
    },
    autoSaveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    autoSaveText: {
      fontSize: 12,
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
    updateButton: {
      backgroundColor: colors.primary,
    },
  });

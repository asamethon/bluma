import { useTheme } from '@/constants/theme';
import type { OfflineLibraryStyles } from '@/features/profile/styles/offlineLibraryStyles';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

export const OfflineLibraryEmpty = memo(function OfflineLibraryEmpty({ styles, onExplore }: { styles: OfflineLibraryStyles; onExplore: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="cloud-offline-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>{t('offlineLibrary.emptyTitle')}</Text>
      <Text style={styles.emptyStateMessage}>{t('offlineLibrary.emptyMessage')}</Text>
      <TouchableOpacity style={styles.exploreButton} onPress={onExplore}>
        <Text style={styles.exploreButtonText}>{t('favorites.exploreButton')}</Text>
      </TouchableOpacity>
    </View>
  );
});

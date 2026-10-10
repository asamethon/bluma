import { useTheme } from '@/constants/theme';
import type { StorageInfo } from '@/features/profile/hooks/useOfflineLibrary';
import type { OfflineLibraryStyles } from '@/features/profile/styles/offlineLibraryStyles';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { formatFileSize } from './fileSize';

export const OfflineStorageSummary = memo(function OfflineStorageSummary({
  storage,
  styles,
}: { storage: StorageInfo; styles: OfflineLibraryStyles }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const percent = storage.total > 0 ? Math.min(100, Math.round((storage.used / storage.total) * 100)) : 0;
  const stats = [
    [String(storage.count), t('common.story')],
    [formatFileSize(storage.used), t('offlineLibrary.used')],
    [formatFileSize(storage.total), t('offlineLibrary.total')],
  ];
  return (
    <View style={styles.storageInfo}>
      <View style={styles.storageHeader}>
        <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
        <Text style={styles.storageTitle}>{t('offlineLibrary.storageInfo')}</Text>
      </View>
      <View style={styles.storageStats}>
        {stats.map(([value, label]) => (
          <View key={label} style={styles.statItem}>
            <Text style={styles.statNumber}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.storageBar}><View style={[styles.storageBarFill, { width: `${percent}%` }]} /></View>
      <Text style={styles.storagePercent}>{t('offlineLibrary.percentUsed', { percent })}</Text>
    </View>
  );
});

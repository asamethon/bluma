import { Avatar, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchStyles as styles } from '../styles/searchStyles';
import type { SearchHistoryItem } from '../types';

type Props = {
  items: SearchHistoryItem[];
  onClear: () => void;
  onOpen: (item: SearchHistoryItem) => void;
  onRemove: (index: number) => void;
};

export function RecentSearches({ items, onClear, onOpen, onRemove }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text variant="subheading" style={{ fontWeight: '700' }}>
          {t('search.recentSearches')}
        </Text>
        <Pressable onPress={onClear}>
          <Text variant="caption" tone="primary">{t('search.clear')}</Text>
        </Pressable>
      </View>
      {items.map((item, index) => (
        <View key={`${item.type}-${item.id || item.query}-${item.timestamp}`}>
          <Pressable style={styles.recentRow} onPress={() => onOpen(item)}>
            <View style={styles.recentContent}>
              {item.type === 'query' && (
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              )}
              {item.type === 'story' && (
                <View style={[styles.recentThumb, { backgroundColor: colors.surfaceVariant }]} />
              )}
              {item.type === 'user' && <Avatar size={36} name={item.name} uri={item.image} />}
              <View>
                <Text variant="body">{item.type === 'query' ? item.query : item.title || item.name}</Text>
                {item.type !== 'query' && (
                  <Text variant="caption" tone="textSecondary">
                    {item.type === 'story' ? t('common.story') : `@${item.username}`}
                  </Text>
                )}
              </View>
            </View>
            <Pressable onPress={() => onRemove(index)} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.textLight} />
            </Pressable>
          </Pressable>
          {index < items.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 46 }]} />
          )}
        </View>
      ))}
    </View>
  );
}

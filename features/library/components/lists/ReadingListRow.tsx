import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { readingListStyles as styles } from '@/features/library/styles/readingListStyles';
import type { ReadingListMeta } from '@/store/slices/readingListSlice';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';

type Props = {
  list: ReadingListMeta;
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string) => void;
};

export const ReadingListRow = memo(function ReadingListRow({ list, onOpen, onDelete }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onOpen(list.id)}
      onLongPress={() => onDelete(list.id, list.name)}
    >
      <View style={[styles.listIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="bookmarks" size={20} color={colors.primary} />
      </View>
      <View style={styles.listBody}>
        <Text variant="subheading" numberOfLines={1} style={styles.headerTitle}>{list.name}</Text>
        <Text variant="caption" tone="textSecondary">
          {t('lists.storyCount', { count: list.storyIds.length })} ·{' '}
          {list.isPublic ? t('lists.public') : t('lists.private')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );
});

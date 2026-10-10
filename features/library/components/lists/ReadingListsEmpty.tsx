import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { readingListStyles as styles } from '@/features/library/styles/readingListStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export function ReadingListsEmpty({ isSignedIn }: { isSignedIn: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!isSignedIn) {
    return (
      <View style={styles.empty}>
        <Ionicons name="log-in-outline" size={44} color={colors.textSecondary} />
        <Text variant="body" tone="textSecondary" style={styles.emptyText}>{t('lists.signInToSee')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <Ionicons name="bookmarks-outline" size={44} color={colors.primaryLight} />
      <Text variant="subheading" style={styles.emptyTitle}>{t('lists.noListsYet')}</Text>
      <Text variant="body" tone="textSecondary" style={styles.emptyText}>{t('lists.noListsHint')}</Text>
    </View>
  );
}

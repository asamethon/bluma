import { Text } from '@/components/ui';
import { ChoiceTile } from '@/components/ui/ChoiceTile';
import { Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = { isCompleted: boolean; onChange: (isCompleted: boolean) => void };

export function StoryStatusField({ isCompleted, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.field}>
      <Text variant="label" tone="textSecondary">{t('studio.storyStatusLabel')}</Text>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={t('studio.storyStatusLabel')}>
        <ChoiceTile
          label={t('storyStatus.ongoing')}
          icon="create-outline"
          selected={!isCompleted}
          onPress={() => onChange(false)}
        />
        <ChoiceTile
          label={t('storyStatus.completed')}
          icon="checkmark-done-outline"
          selected={isCompleted}
          onPress={() => onChange(true)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});

import { Button, Text } from '@/components/ui';
import { Radius, Spacing, alpha, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  prompt: string;
  starting: boolean;
  onStart: () => void;
  onStartWithPrompt: () => void;
};

export function WriterNudgeCard({ prompt, starting, onStart, onStartWithPrompt }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { backgroundColor: alpha(colors.primary, 0.06), borderLeftColor: colors.primary }]}>
      <View style={styles.headRow}>
        <View style={[styles.icon, { backgroundColor: alpha(colors.bloom, 0.14) }]}>
          <Ionicons name="create-outline" size={20} color={colors.bloom} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading">
            {t('writerNudge.title')}
          </Text>
          <Text variant="caption" tone="textSecondary" style={{ marginTop: 2 }}>
            {t('writerNudge.subtitle')}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onStartWithPrompt}
        disabled={starting}
        style={[styles.promptBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text variant="label" tone="textSecondary">
          {t('writerNudge.promptLabel')}
        </Text>
        <Text variant="body" style={{ marginTop: 4 }}>
          {prompt}
        </Text>
        <View style={styles.promptCtaRow}>
          <Text variant="bodyStrong" color={colors.primary}>
            {t('writerNudge.promptCta')}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </View>
      </Pressable>

      <Button
        label={t('writerNudge.cta')}
        variant="primary"
        icon="add"
        loading={starting}
        onPress={onStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderLeftWidth: 2,
    gap: Spacing.lg,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptBox: {
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  promptCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
});

import { Button, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  prompt: string;
  starting: boolean;
  onStart: () => void;
  onStartWithPrompt: () => void;
};

export function WriterNudgeCard({ prompt, starting, onStart, onStartWithPrompt }: Props) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
      <View style={styles.headRow}>
        <View style={[styles.icon, shadows.bloom, { backgroundColor: colors.bloom }]}>
          <Ionicons name="create" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={{ fontSize: 16.5 }}>
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
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    gap: Spacing.md + 2,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptBox: {
    padding: Spacing.md + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  promptCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
});

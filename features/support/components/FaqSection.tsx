import { Divider, SettingsGroup, Text } from '@/components/ui';
import { Motion, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { createHelpStyles } from '../styles/helpStyles';

const FAQS = [
  { question: 'help.faq1q', answer: 'help.faq1a' },
  { question: 'help.faq2q', answer: 'help.faq2a' },
  { question: 'help.faq3q', answer: 'help.faq3a' },
] as const;

/** Açılır SSS. Cevap, editoryal alıntı gibi sol kuralla girintilenir. */
export function FaqSection() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createHelpStyles(colors), [colors]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SettingsGroup title={t('help.faqSection')}>
      {FAQS.map((item, index) => {
        const open = openIndex === index;
        return (
          <View key={item.question}>
            <View style={styles.faqItem}>
              <Pressable
                style={({ pressed }) => [styles.faqButton, { opacity: pressed ? Motion.pressOpacity : 1 }]}
                onPress={() => setOpenIndex(open ? null : index)}
              >
                <Text variant="bodyStrong" style={styles.faqQuestion}>
                  {t(item.question)}
                </Text>
                <Ionicons
                  name={open ? 'remove' : 'add'}
                  size={18}
                  color={open ? colors.primary : colors.textLight}
                />
              </Pressable>
              {open && (
                <View style={styles.faqAnswer}>
                  <Text variant="body" tone="textSecondary">
                    {t(item.answer)}
                  </Text>
                </View>
              )}
            </View>
            {index < FAQS.length - 1 && <Divider />}
          </View>
        );
      })}
    </SettingsGroup>
  );
}

import { BloomMark, Button, Text } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

const FADE_STEPS = [0.12, 0.25, 0.42, 0.6, 0.78, 0.92];

type Props = { totalChapters: number; readingColors: ReaderColors };

export function ReaderGuestGate({ totalChapters, readingColors }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { startAuth } = useGuestGate();
  const benefits = [
    { icon: 'infinite-outline', label: t('authGate.benefitUnlimited') },
    { icon: 'bookmark-outline', label: t('reader.benefitContinue') },
    { icon: 'cloud-offline-outline', label: t('reader.benefitOffline') },
  ] as const;

  return (
    <View>
      {/* Metnin altına doğru sönen kademeli perde: son satırlar okunmaz olur. */}
      <View pointerEvents="none" style={styles.gateFade}>
        {FADE_STEPS.map((opacity, index) => (
          <View
            key={opacity}
            style={[
              styles.gateFadeStep,
              {
                top: Math.floor((index / FADE_STEPS.length) * 80),
                height: Math.ceil(80 / FADE_STEPS.length) + 1,
                backgroundColor: readingColors.background,
                opacity,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.gateCard, { backgroundColor: readingColors.surface, borderColor: readingColors.border }]}>
        <View style={[styles.gateKicker, { backgroundColor: alpha(colors.primary, 0.12) }]}>
          <Ionicons name="lock-closed" size={11} color={colors.primary} />
          <Text variant="labelSm" color={colors.primary}>{t('reader.previewChapter1')}</Text>
        </View>

        <View style={styles.gateLogo}><BloomMark size={36} /></View>

        <Text variant="titleSm" color={readingColors.text} style={styles.gateTitle}>{t('reader.gateTitle')}</Text>
        <Text variant="body" color={readingColors.textSecondary} style={styles.gateSub}>
          {totalChapters > 1 ? t('reader.gateSubMulti', { count: totalChapters }) : t('reader.gateSubSingle')}
        </Text>

        <View style={styles.gateChips}>
          {benefits.map(benefit => (
            <View key={benefit.label} style={styles.gateChip}>
              <Ionicons name={benefit.icon} size={15} color={colors.primary} />
              <Text variant="label" color={readingColors.textSecondary}>{benefit.label}</Text>
            </View>
          ))}
        </View>

        <Button
          label={t('guest.createAccount')}
          variant="primary"
          size="lg"
          iconRight="arrow-forward"
          fullWidth
          onPress={() => startAuth('signup')}
        />

        <View style={styles.gateLoginRow}>
          <Text variant="caption" color={readingColors.textSecondary}>{t('guest.alreadyHaveAccount')} </Text>
          <Pressable onPress={() => startAuth('login')}>
            <Text variant="label" tone="primary">{t('guest.signIn')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

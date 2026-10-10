import { authGateSheetStyles as styles } from '@/features/auth/styles/authGateSheetStyles';
import { BloomMark, Button, Sheet, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { GATE_REASONS, useGuestGate } from '@/contexts/GuestContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const BENEFITS = [
  { icon: 'infinite-outline', label: 'authGate.benefitUnlimited' },
  { icon: 'bookmark-outline', label: 'authGate.benefitLibrary' },
  { icon: 'people-outline',   label: 'authGate.benefitFollow' },
];

export function AuthGateSheet() {
  const { gate, closeGate, startAuth } = useGuestGate();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const reason = gate ? GATE_REASONS[gate.reason] : GATE_REASONS.default;

  return (
    <Sheet visible={!!gate} onClose={closeGate}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.logoWrap}>
          <View style={[styles.logoBox, { backgroundColor: colors.primarySoft }]}>
            <BloomMark size={40} />
            <View style={[styles.reasonBadge, { backgroundColor: colors.bloom, borderColor: colors.surface }]}>
              <Ionicons name={reason.icon as any} size={13} color="#fff" />
            </View>
          </View>
        </View>

        <Text variant="title" style={styles.title}>{t(reason.title)}</Text>
        <Text variant="body" tone="textSecondary" style={styles.sub}>{t(reason.sub)}</Text>

        <View style={styles.benefits}>
          {BENEFITS.map(b => (
            <View key={b.label} style={[styles.benefitBox, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name={b.icon as any} size={20} color={colors.primary} />
              <Text variant="labelSm" tone="textSecondary" style={styles.benefitLabel}>{t(b.label)}</Text>
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

        <View style={styles.loginRow}>
          <Text variant="body" tone="textSecondary">{t('guest.alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => startAuth('login')}>
            <Text variant="bodyStrong" tone="primary">{t('guest.signIn')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={closeGate} style={styles.skipBtn}>
      <Text variant="label" tone="textLight">{t('authGate.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Sheet>
  );
}

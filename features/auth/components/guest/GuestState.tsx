import { BloomMark, Button, Divider, Text } from '@/components/ui';
import { useGuestGate } from '@/contexts/GuestContext';
import { guestStateStyles as styles } from '@/features/auth/styles/guestStateStyles';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { GuestBenefitRow } from './GuestBenefitRow';
import { GUEST_CONTENT, type GuestKind } from './guestContent';

/** Misafir kullanıcıya kaydolmanın karşılığını anlatan boş durum. */
export function GuestState({ kind }: { kind: GuestKind }) {
  const { t } = useTranslation();
  const { startAuth } = useGuestGate();
  const content = GUEST_CONTENT[kind];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <BloomMark size={40} style={styles.mark} />

      <Text variant="title" style={styles.title}>{t(content.title)}</Text>
      <Text variant="body" tone="textSecondary" style={styles.sub}>{t(content.sub)}</Text>

      <View style={styles.rows}>
        <Divider />
        {content.rows.map(row => (
          <GuestBenefitRow key={row.label} icon={row.icon} label={row.label} />
        ))}
      </View>

      <View style={styles.actions}>
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
          <Pressable onPress={() => startAuth('login')}>
            <Text variant="bodyStrong" tone="primary">{t('guest.signIn')}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

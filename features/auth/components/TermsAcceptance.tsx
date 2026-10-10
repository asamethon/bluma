import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/legal';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = { accepted: boolean; onToggle: () => void };

export function TermsAcceptance({ accepted, onToggle }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[
        styles.checkbox,
        accepted
          ? { backgroundColor: colors.primary, borderWidth: 0 }
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
      ]}>
        {accepted && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text variant="caption" tone="textSecondary" style={styles.text}>
        <Text variant="caption" style={[styles.link, { color: colors.text }]} onPress={openTermsOfService}>
          {t('legal.terms')}
        </Text>
        {' '}{t('auth.termsAnd')}{' '}
        <Text variant="caption" style={[styles.link, { color: colors.text }]} onPress={openPrivacyPolicy}>
          {t('legal.privacyPolicy')}
        </Text>
        {t('auth.termsAccept')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 2 },
  checkbox: {
    width: 22, height: 22, marginTop: 1, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  text: { flex: 1, lineHeight: 20 },
  link: { fontWeight: '700' },
});

import { walkthroughStyles as styles } from '@/features/auth/styles/walkthroughStyles';
import { authActions } from '@/store/authStore';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/legal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';

export function WalkthroughActions({ style }: { style: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Animated.View style={[styles.wActions, style]}>
      <TouchableOpacity
        style={styles.wBtnPrimary}
        onPress={() => router.push('/(auth)/signup')}
        activeOpacity={0.88}
      >
        <Text style={styles.wBtnPrimaryText}>{t('walkthrough.createAccount')}</Text>
        <Ionicons name="arrow-forward" size={19} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.wBtnSecondary}
        onPress={() => router.push('/(auth)/signin')}
        activeOpacity={0.88}
      >
        <Text style={styles.wBtnSecondaryText}>{t('auth.signIn')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.wBtnGuest}
        onPress={() => {
          authActions.continueAsGuest();
          router.replace('/');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.wBtnGuestText}>{t('walkthrough.exploreAsGuest')}</Text>
        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.82)" />
      </TouchableOpacity>

      <Text style={styles.wTerms}>
        {t('walkthrough.termsPrefix')}{' '}
        <Text style={styles.wTermsLink} onPress={openTermsOfService}>{t('legal.terms')}</Text>
        {' '}{t('auth.termsAnd')}{' '}
        <Text style={styles.wTermsLink} onPress={openPrivacyPolicy}>{t('legal.privacyPolicy')}</Text>
        {t('walkthrough.termsSuffix')}
      </Text>
    </Animated.View>
  );
}

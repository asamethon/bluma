import { PRIVACY_POLICY_URL, TERMS_URL } from '@/constants/config';
import { router } from 'expo-router';
import i18n from '@/i18n';

function openLegal(url: string, title: string) {
  router.push(`/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` as any);
}

export const openPrivacyPolicy = () => openLegal(PRIVACY_POLICY_URL, i18n.t('legal.privacyPolicy'));
export const openTermsOfService = () => openLegal(TERMS_URL, i18n.t('legal.terms'));

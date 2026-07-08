import { PRIVACY_POLICY_URL, TERMS_URL } from '@/constants/config';
import { router } from 'expo-router';

// Yasal sayfayı uygulama içi WebView ekranında açar (app/webview.tsx).
function openLegal(url: string, title: string) {
  router.push(`/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` as any);
}

export const openPrivacyPolicy = () => openLegal(PRIVACY_POLICY_URL, 'Gizlilik Politikası');
export const openTermsOfService = () => openLegal(TERMS_URL, 'Kullanım Koşulları');

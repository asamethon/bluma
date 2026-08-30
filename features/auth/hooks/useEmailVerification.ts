import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { changeUnverifiedEmail } from '../services/emailChange';
import {
  needsEmailVerification,
  refreshVerificationState,
  sendVerificationEmail,
} from '../services/emailVerification';
import { suggestEmailFix } from '../utils/emailTypos';

/**
 * Doğrulama akışının tamamı. Tek bir "Doğrula" eylemi var: kullanıcı adresi
 * DEĞİŞTİRDİYSE bağlantı yeni adrese gider (adres ancak tıklanınca değişir),
 * değiştirmediyse mevcut adrese yeniden gönderilir. Kullanıcı açısından tek
 * düğme; ayrı "değiştir" adımı yok.
 */
export function useEmailVerification() {
  const { t } = useTranslation();
  const currentEmail = useAppSelector(s => s.auth.user?.email) || '';
  const [verified, setVerified] = useState(() => !needsEmailVerification());
  const [draft, setDraft] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const changed = draft.trim().toLowerCase() !== currentEmail.toLowerCase();

  /** Yazım hatası varsa sorar. false → kullanıcı düzeltmeyi seçti, bekle. */
  const confirmTypo = useCallback(() => {
    const suggestion = suggestEmailFix(draft);
    if (!suggestion) return Promise.resolve(true);
    return new Promise<boolean>(resolve => {
      Alert.alert(t('emailVerify.typoTitle'), t('emailVerify.typoBody', { suggestion }), [
        { text: t('emailVerify.typoKeep'), style: 'cancel', onPress: () => resolve(true) },
        { text: t('emailVerify.typoUse'), onPress: () => { setDraft(suggestion); resolve(false); } },
      ]);
    });
  }, [draft, t]);

  const submit = useCallback(async () => {
    if (!(await confirmTypo())) return;
    setBusy(true);
    const result = changed
      ? await changeUnverifiedEmail(draft, password || undefined)
      : await sendVerificationEmail();
    setBusy(false);

    setNeedsPassword(!!(result as any).needsPassword);
    if (result.success) {
      setPassword('');
      setSentTo(draft.trim());
      Alert.alert(t('emailVerify.sentTitle'), t('emailVerify.sentBody', { email: draft.trim() }));
    } else {
      Alert.alert(t('common.error'), result.error || '');
    }
  }, [changed, confirmTypo, draft, password, t]);

  const check = useCallback(async () => {
    setBusy(true);
    const ok = await refreshVerificationState();
    setBusy(false);
    setVerified(ok);
    Alert.alert(
      t(ok ? 'emailVerify.verifiedTitle' : 'emailVerify.notYetTitle'),
      t(ok ? 'emailVerify.verifiedBody' : 'emailVerify.notYetBody')
    );
  }, [t]);

  return {
    currentEmail,
    verified,
    draft,
    setDraft,
    changed,
    password,
    setPassword,
    needsPassword,
    busy,
    sentTo,
    submit,
    check,
  };
}

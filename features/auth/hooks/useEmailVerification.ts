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

/** Doğrulama ekranının tüm durumu — ekran yalnızca dizer. */
export function useEmailVerification() {
  const { t } = useTranslation();
  const email = useAppSelector(s => s.auth.user?.email) || '';
  const [verified, setVerified] = useState(() => !needsEmailVerification());
  const [busy, setBusy] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

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

  const resend = useCallback(async () => {
    setBusy(true);
    const result = await sendVerificationEmail();
    setBusy(false);
    Alert.alert(
      t(result.success ? 'emailVerify.sentTitle' : 'common.error'),
      result.success ? t('emailVerify.sentBody', { email }) : result.error || ''
    );
  }, [email, t]);

  const submitChange = useCallback(async () => {
    // Yeni adreste de yazım hatası olabilir — göndermeden önce sor.
    const suggestion = suggestEmailFix(newEmail);
    if (suggestion) {
      const confirmed = await new Promise<boolean>(resolve => {
        Alert.alert(t('emailVerify.typoTitle'), t('emailVerify.typoBody', { suggestion }), [
          { text: t('emailVerify.typoKeep'), style: 'cancel', onPress: () => resolve(true) },
          { text: t('emailVerify.typoUse'), onPress: () => { setNewEmail(suggestion); resolve(false); } },
        ]);
      });
      if (!confirmed) return;
    }

    setBusy(true);
    const result = await changeUnverifiedEmail(newEmail, password || undefined);
    setBusy(false);
    setNeedsPassword(!!result.needsPassword);
    if (result.success) {
      setPassword('');
      Alert.alert(t('emailVerify.changeSentTitle'), t('emailVerify.changeSentBody', { email: newEmail.trim() }));
    } else {
      Alert.alert(t('common.error'), result.error || '');
    }
  }, [newEmail, password, t]);

  return {
    email,
    verified,
    busy,
    newEmail,
    setNewEmail,
    password,
    setPassword,
    needsPassword,
    check,
    resend,
    submitChange,
  };
}

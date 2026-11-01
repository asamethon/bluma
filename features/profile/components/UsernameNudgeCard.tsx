import { Button, Callout, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useUsernameNudge } from '../hooks/useUsernameNudge';
import { trackNudgeShown } from '../services/usernameNudgeEvents';
import { UsernameSuggestions } from './UsernameSuggestions';

/**
 * Kendi profilindeki tek seferlik, kapatılabilir kullanıcı adı kartı.
 *
 * Çipe dokunmak profil düzenlemeyi o ad ÖNCEDEN DOLDURULMUŞ hâlde açar;
 * kaydetmek kullanıcıya kalır — biz kimsenin adını kendiliğimizden
 * değiştirmeyiz. "Böyle kalsın" kararı uid'e bağlı olarak kalıcı saklanır.
 */
export function UsernameNudgeCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const nudge = useUsernameNudge();
  const { reason, visible } = nudge;

  useEffect(() => {
    if (visible && reason) trackNudgeShown(reason);
  }, [reason, visible]);

  if (!visible) return null;

  return (
    <Callout tone="info" icon="at-outline" title={t('username.nudgeTitle')} style={styles.root}>
      <Text variant="caption" tone="textSecondary">
        {reason === 'mangled' ? t('username.nudgeMangled') : t('username.nudgeBody')}
      </Text>
      <UsernameSuggestions
        suggestions={nudge.suggestions}
        onPick={username => router.push({ pathname: '/profile/edit', params: { username } })}
      />
      <View style={styles.actions}>
        <Button
          label={t('username.pickOwn')}
          variant="secondary"
          size="sm"
          onPress={() => router.push('/profile/edit')}
        />
        <Button label={t('username.keep')} variant="ghost" size="sm" onPress={nudge.dismiss} />
      </View>
    </Callout>
  );
}

const styles = StyleSheet.create({
  root: { marginHorizontal: Spacing.screenX, marginBottom: Spacing.lg },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
});

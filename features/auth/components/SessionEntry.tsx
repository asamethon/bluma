import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { sessionEntryRoute } from '../services/sessionEntry';

export function SessionEntry() {
  const route = useAppSelector(state => sessionEntryRoute(state.auth));
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (route) return <Redirect href={route} />;
  return (
    <Screen style={styles.loading}>
      <ActivityIndicator color={colors.primary} accessibilityLabel={t('auth.loadingSession')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

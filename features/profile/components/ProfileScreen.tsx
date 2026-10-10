import { GuestState } from '@/features/auth/components/guest/GuestState';
import { Screen, Text } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useOwnProfileData } from '../hooks/useOwnProfileData';
import { OwnProfileScreen } from './OwnProfileScreen';

export function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const data = useOwnProfileData();
  const screenStyle = { flex: 1, backgroundColor: colors.background } as const;

  if (data.isGuest) {
    return (
      <Screen style={screenStyle} maxContentWidth={ContentMaxWidth.content}>
        <GuestState kind="profile" />
      </Screen>
    );
  }
  if (!data.currentUser) {
    return (
      <Screen style={[screenStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text variant="body" tone="textSecondary">{t('profileScreen.loadingUser')}</Text>
      </Screen>
    );
  }
  return (
    <OwnProfileScreen
      user={data.currentUser}
      stories={data.stories}
      conversations={data.conversations}
      loading={data.isLoading}
    />
  );
}

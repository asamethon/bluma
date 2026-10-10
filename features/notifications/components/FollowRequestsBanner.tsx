import { ListRow } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/** Bekleyen takip isteklerini listenin başında duyuran satır. */
export function FollowRequestsBanner({ count }: { count: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  if (!count) return null;

  return (
    <ListRow
      icon="person-add-outline"
      title={t('followRequests.title')}
      subtitle={t('followRequests.pendingCount', { count })}
      onPress={() => router.push('/profile/follow-requests')}
      style={{ paddingHorizontal: 20 }}
    />
  );
}

import { EmptyState } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ProfileTab } from '../profileRows';

type Props = { tab: ProfileTab; onCompose: () => void };

/** Kendi profilimin boş sekmesi: her zaman tek net bir sonraki adım verir. */
export function OwnProfileEmpty({ tab, onCompose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  if (tab === 'stories') {
    return (
      <EmptyState
        compact
        icon="book-outline"
        title={t('profileScreen.noPublishedStories')}
        actionLabel={t('profileScreen.writeFirstStory')}
        onAction={() => router.push('/(tabs)/write')}
      />
    );
  }
  return (
    <EmptyState
      compact
      icon="chatbubble-ellipses-outline"
      title={t('profileScreen.noMessagesShared')}
      actionLabel={t('profileScreen.shareMessage')}
      onAction={onCompose}
    />
  );
}

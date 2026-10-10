import { EmptyState } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import type { ProfileTab } from '../profileRows';

type Props = { tab: ProfileTab };

/** Başkasının profilinde boş sekme: aksiyon yok, yalnızca sakin bir künye. */
export function UserProfileEmptyState({ tab }: Props) {
  const { t } = useTranslation();
  const stories = tab === 'stories';

  return (
    <EmptyState
      compact
      icon={stories ? 'book-outline' : 'chatbubble-ellipses-outline'}
      title={t(stories ? 'userProfile.authorNoStories' : 'userProfile.authorNoMessages')}
    />
  );
}

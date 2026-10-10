import { Button, PageHeader } from '@/components/ui';
import { useTranslation } from 'react-i18next';

type Props = { unreadCount?: number; onBack: () => void; onMarkAll?: () => void };

export function NotificationHeader({ unreadCount = 0, onBack, onMarkAll }: Props) {
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t('notifications.title')}
      onBack={onBack}
      right={
        unreadCount > 0 && onMarkAll ? (
          <Button label={t('notifications.markAllRead')} variant="ghost" size="sm" onPress={onMarkAll} />
        ) : undefined
      }
    />
  );
}

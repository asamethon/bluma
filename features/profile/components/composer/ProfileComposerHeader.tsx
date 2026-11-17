import { Button, PageHeader } from '@/components/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  /** Pano sahibinin adı; verilirse gönderi onun panosuna gider. */
  boardOwnerName?: string;
  canPost: boolean;
  posting: boolean;
  onCancel: () => void;
  onPost: () => void;
};

/**
 * Konuşma oluşturma ekranıyla aynı kalıp (CreateConversationHeader):
 * PageHeader + sağda ghost "Paylaş". Hedef, künye dilindeki "▸" ile alt
 * satırda durur — isimden sonra ek gerektirmeyen tek biçim.
 */
export const ProfileComposerHeader = memo(function ProfileComposerHeader(props: Props) {
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t(props.boardOwnerName ? 'profileScreen.boardMessageTitle' : 'profileScreen.shareMessage')}
      subtitle={props.boardOwnerName ? `▸ ${props.boardOwnerName}` : undefined}
      onBack={props.onCancel}
      right={(
        <Button
          label={t('messages.share')}
          variant="ghost"
          size="sm"
          loading={props.posting}
          disabled={!props.canPost}
          onPress={props.onPost}
        />
      )}
    />
  );
});

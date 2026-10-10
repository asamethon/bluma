import { Button, PageHeader } from '@/components/ui';
import type { CreateConversationStyles } from '@/features/conversation/styles/createConversationStyles';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  canSubmit: boolean;
  submitting: boolean;
  styles: CreateConversationStyles;
  onCancel: () => void;
  onSubmit: () => void;
};

export const CreateConversationHeader = memo(function CreateConversationHeader(props: Props) {
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t('conversations.startConversation')}
      onBack={props.onCancel}
      right={(
        <Button
          label={t('messages.share')}
          variant="ghost"
          size="sm"
          loading={props.submitting}
          disabled={!props.canSubmit}
          onPress={props.onSubmit}
        />
      )}
    />
  );
});

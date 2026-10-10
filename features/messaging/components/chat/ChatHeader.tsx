import { Avatar, IconButton, Text } from '@/components/ui';
import type { ChatStyles } from '@/features/messaging/styles/chatStyles';
import { formatPresence } from '@/features/privacy/hooks/usePresence';
import type { User } from '@/types';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Presence = Parameters<typeof formatPresence>[0];
type Props = {
  otherUser: User | null | undefined;
  presence: Presence;
  safeTop: number;
  styles: ChatStyles;
  onBack: () => void;
  onProfile: () => void;
};

export const ChatHeader = memo(function ChatHeader(props: Props) {
  const { t } = useTranslation();
  const presenceLabel = formatPresence(props.presence);
  return (
    <View style={[props.styles.header, { paddingTop: props.safeTop }]}>
      <IconButton icon="arrow-back" onPress={props.onBack} />
      <Pressable style={props.styles.headerCopy} onPress={props.onProfile} disabled={!props.otherUser}>
        <Text variant="subheading" numberOfLines={1}>{props.otherUser?.displayName || t('messages.chat')}</Text>
        {presenceLabel ? (
          <Text variant="caption" tone={props.presence.online ? 'primary' : 'textLight'}>{presenceLabel}</Text>
        ) : props.otherUser?.username ? (
          <Text variant="caption" tone="textLight">@{props.otherUser.username}</Text>
        ) : null}
      </Pressable>
      <Avatar uri={props.otherUser?.profileImage} name={props.otherUser?.displayName} size={34} />
    </View>
  );
});

import { StoryRow } from '@/components/ui';
import type { Conversation, Story } from '@/types';
import { memo } from 'react';
import { View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileConversationCard } from './ProfileConversationCard';

type Props = {
  kind: 'story' | 'conversation';
  item: Story | Conversation;
  onStory: (story: Story) => void;
  onConversation: (conversation: Conversation) => void;
  onImage: (uri: string) => void;
};

function UserProfileListItemComponent({ kind, item, onStory, onConversation, onImage }: Props) {
  return (
    <View style={styles.tabRow}>
      {kind === 'story' ? (
        <StoryRow
          story={item as Story}
          status={(item as Story).isCompleted ? 'completed' : 'ongoing'}
          onPress={() => onStory(item as Story)}
        />
      ) : (
        <ProfileConversationCard
          conversation={item as Conversation}
          onPress={() => onConversation(item as Conversation)}
          onImagePress={onImage}
        />
      )}
    </View>
  );
}

export const UserProfileListItem = memo(UserProfileListItemComponent);

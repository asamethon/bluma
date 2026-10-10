import { StoryRow } from '@/components/ui';
import type { Conversation, Story } from '@/types';
import { memo } from 'react';
import { View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileConversationCard } from './ProfileConversationCard';

type Props = {
  item: Story | Conversation;
  kind: 'story' | 'conversation';
  onPressStory: (id: string) => void;
  onStoryMenu: (story: Story) => void;
  onPressConversation: (id: string) => void;
  onConversationImage: (uri: string) => void;
  onDeleteConversation: (conversation: Conversation) => void;
};

const storyStatus = (story: Story) => {
  if (!story.isPublished) return 'draft';
  return story.isCompleted ? 'completed' : 'ongoing';
};

function OwnProfileListItemComponent(props: Props) {
  if (props.kind === 'story') {
    const story = props.item as Story;
    return (
      <View style={styles.tabRow}>
        <StoryRow
          story={story}
          status={storyStatus(story)}
          onPress={() => props.onPressStory(story.id)}
          onMenu={() => props.onStoryMenu(story)}
        />
      </View>
    );
  }

  const conversation = props.item as Conversation;
  return (
    <View style={styles.tabRow}>
      <ProfileConversationCard
        conversation={conversation}
        onPress={() => props.onPressConversation(conversation.id)}
        onImagePress={props.onConversationImage}
        onDelete={() => props.onDeleteConversation(conversation)}
      />
    </View>
  );
}

export const OwnProfileListItem = memo(OwnProfileListItemComponent);

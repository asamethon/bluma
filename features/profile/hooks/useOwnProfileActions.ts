import { authActions } from '@/store/authStore';
import { conversationActions } from '@/store/conversationStore';
import { storyActions } from '@/store/storyStore';
import type { Conversation, Story, User } from '@/types';
import { buildProfileShareUrl } from '@/utils/deepLinks';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { Alert, Share } from 'react-native';

type Params = { user: User; router: ReturnType<typeof useRouter>; t: TFunction };

export function useOwnProfileActions({ user, router, t }: Params) {
  const shareProfile = async () => {
    const name = user.displayName || `@${user.username || 'bluma'}`;
    try {
      const url = buildProfileShareUrl(user.id);
      await Share.share({ title: `${name} • Bluma`, message: t('profileScreen.shareProfileMessage', { name, url }) });
    } catch (error) {
      logger.error('Share profile error', error);
    }
  };

  const openStoryMenu = (story: Story) => {
    const revert = () => Alert.alert(
      t('profileScreen.revertToDraft'),
      t('profileScreen.revertToDraftConfirm', { title: story.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profileScreen.revertToDraft'),
          onPress: () => void storyActions.updateStory(story.id, { isPublished: false }).catch(() => {
            Alert.alert(t('common.error'), t('profileScreen.revertToDraftFailed'));
          }),
        },
      ],
    );
    const remove = () => Alert.alert(t('studio.deleteStoryTitle'), t('profileScreen.deleteStoryConfirm', {
      title: story.title,
    }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void storyActions.deleteStory(story.id) },
    ]);
    Alert.alert(t('profileScreen.storyOptionsTitle'), t('profileScreen.storyOptionsMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.edit'), onPress: () => router.push(`/story/compose/${story.id}?ch=0` as never) },
      { text: t('profileScreen.revertToDraft'), onPress: revert },
      { text: t('common.delete'), style: 'destructive', onPress: remove },
    ]);
  };

  const deleteConversation = (conversation: Conversation) => Alert.alert(
    t('profileScreen.deleteConversationTitle'),
    t('profileScreen.deleteConversationConfirm'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => void conversationActions.deleteConversation(conversation.id),
      },
    ],
  );

  const signOut = () => Alert.alert(t('profileScreen.signOut'), t('profileScreen.signOutConfirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('profileScreen.signOut'),
      style: 'destructive',
      onPress: () => {
        void authActions.signOut();
        router.replace('/');
      },
    },
  ]);

  return { deleteConversation, openStoryMenu, shareProfile, signOut };
}

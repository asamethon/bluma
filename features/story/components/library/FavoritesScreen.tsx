import { FavoriteStoryCard } from '@/features/story/components/FavoriteStoryCard';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { StoryCollectionScreen } from './StoryCollectionScreen';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const likedStories = useAppSelector(state => state.story.likedStories);

  const confirmUnlike = useCallback((story: Story) => {
    Alert.alert(t('favorites.removeTitle'), t('favorites.removeConfirm', { title: story.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lists.remove'),
        style: 'destructive',
        onPress: () => {
          void storyActions.unlikeStory(story.id).then(result => {
            if (result.success) Alert.alert(t('common.success'), t('favorites.removed'));
            else Alert.alert(t('common.error'), result.error || t('favorites.removeFailed'));
          });
        },
      },
    ]);
  }, [t]);

  return (
    <StoryCollectionScreen
      title={t('favorites.title')}
      stories={likedStories}
      reload={storyActions.refreshLikedStoriesState}
      loginMessage={t('favorites.loginMessage')}
      loadingLabel={t('favorites.loading')}
      empty={{
        icon: 'heart-outline',
        title: t('favorites.emptyTitle'),
        message: t('favorites.emptyMessage'),
        action: { label: t('favorites.exploreButton'), onPress: () => router.push('/(tabs)') },
      }}
      renderItem={story => (
        <FavoriteStoryCard
          story={story}
          onPress={() => router.push(`/story/${story.id}/preview`)}
          onUnlike={confirmUnlike}
        />
      )}
    />
  );
}

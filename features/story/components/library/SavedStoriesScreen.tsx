import { SavedStoryCard } from '@/features/story/components/SavedStoryCard';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StoryCollectionScreen } from './StoryCollectionScreen';

export default function SavedStoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const savedStories = useAppSelector(state => state.story.savedStories);

  return (
    <StoryCollectionScreen
      title={t('saved.title')}
      stories={savedStories}
      reload={storyActions.loadSavedStories}
      loginMessage={t('saved.loginMessage')}
      loadingLabel={t('saved.loading')}
      empty={{
        icon: 'bookmark-outline',
        title: t('saved.emptyTitle'),
        message: t('saved.emptyMessage'),
      }}
      renderItem={story => (
        <SavedStoryCard
          story={story}
          onPress={() => router.push(`/story/${story.id}/preview`)}
          onAuthorPress={() => router.push(`/user/${story.authorId}`)}
          onUnsave={() => void storyActions.saveStory(story.id)}
        />
      )}
    />
  );
}

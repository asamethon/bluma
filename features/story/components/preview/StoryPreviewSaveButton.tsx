import { IconButton } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';

/** Kaydetme durumu yalnızca bu düğmeyi ilgilendirir; seçici burada okunur. */
export function StoryPreviewSaveButton({ storyId, onPress }: { storyId: string; onPress: () => void }) {
  const { t } = useTranslation();
  const saved = useAppSelector(state => state.story.savedStories.some(item => item.id === storyId));

  return (
    <IconButton
      icon={saved ? 'bookmark' : 'bookmark-outline'}
      size={38}
      iconSize={21}
      accessibilityLabel={t(saved ? 'storyScreen.inLibrary' : 'storyScreen.addToLibrary')}
      onPress={onPress}
    />
  );
}

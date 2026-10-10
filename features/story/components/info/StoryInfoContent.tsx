import { Button, SectionHeader, Text } from '@/components/ui';
import type { StoryInfoStyles } from '@/features/story/styles/storyInfoStyles';
import type { Story } from '@/types';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { StoryChapterItem, StoryChapterRow } from './StoryChapterRow';
import { StoryInfoActions } from './StoryInfoActions';
import { StoryInfoHero } from './StoryInfoHero';

type Props = {
  chapters: StoryChapterItem[];
  downloaded: boolean;
  downloading: boolean;
  saved: boolean;
  savedChapter: number | null;
  story: Story;
  styles: StoryInfoStyles;
  updatedLabel?: string;
  onAuthorPress: () => void;
  onDownload: () => void;
  onRead: (chapter: number) => void;
  onSave: () => void;
  onShare: () => void;
};

export const StoryInfoContent = memo(function StoryInfoContent(props: Props) {
  const { t } = useTranslation();
  const { chapters, story, styles } = props;
  const renderChapter = useCallback(
    ({ item }: { item: StoryChapterItem }) => <StoryChapterRow item={item} styles={styles} onPress={props.onRead} />,
    [props.onRead, styles],
  );

  return (
    <FlatList
      data={chapters}
      keyExtractor={item => item.id}
      renderItem={renderChapter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={(
        <>
          <StoryInfoHero story={story} styles={styles} onAuthorPress={props.onAuthorPress} />
          <StoryInfoActions
            downloaded={props.downloaded}
            downloading={props.downloading}
            saved={props.saved}
            styles={styles}
            onDownload={props.onDownload}
            onSave={props.onSave}
            onShare={props.onShare}
          />
          {story.description ? (
            <View style={styles.description}>
              <Text variant="bodyLg" tone="textSecondary">{story.description}</Text>
            </View>
          ) : null}
          <SectionHeader title={t('studio.chapters')} subtitle={props.updatedLabel} />
        </>
      )}
      ListFooterComponent={(
        <View style={styles.footerActions}>
          {props.savedChapter !== null ? (
            <Button
              label={t('storyScreen.continueFromChapter', { chapter: props.savedChapter + 1 })}
              icon="play-circle-outline"
              variant="bloom"
              size="lg"
              fullWidth
              onPress={() => props.onRead(props.savedChapter!)}
            />
          ) : null}
          <Button
            label={t('storyScreen.readFromStart')}
            icon="book-outline"
            size="lg"
            fullWidth
            onPress={() => props.onRead(0)}
          />
        </View>
      )}
    />
  );
});

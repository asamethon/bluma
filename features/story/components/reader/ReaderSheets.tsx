import AddToListSheet from '@/features/library/components/AddToListSheet';
import { ShareStorySheet } from '@/features/messaging/components/ShareStorySheet';
import ReportSheet from '@/features/moderation/components/ReportSheet';
import type { ReaderChapter } from '@/features/story/utils/readerContent';
import type { Story } from '@/types';
import { buildStoryShareUrl } from '@/utils/deepLinks';
import { Share } from 'react-native';
import type { ReaderOverlay } from '../../hooks/useReaderUi';
import { ReaderChaptersSheet } from './ReaderChaptersSheet';
import { ReaderSettingsSheet } from './ReaderSettingsSheet';
import type { ReaderColors } from './types';

type Props = {
  story: Story;
  colors: ReaderColors;
  chapters: ReaderChapter[];
  chapterIndex: number;
  overlay: ReaderOverlay;
  onClose: () => void;
  onSelectChapter: (index: number) => void;
};

/** Okuyucunun tüm yüzen katmanları tek yerde toplanır. */
export function ReaderSheets(props: Props) {
  const { story, overlay, onClose } = props;
  const shareLink = async () => {
    const url = buildStoryShareUrl(story.id);
    await Share.share({
      title: story.title,
      message: story.title ? `"${story.title}" hikayesini Bluma'da oku:\n${url}` : url,
    });
  };

  return (
    <>
      <ReaderSettingsSheet visible={overlay === 'settings'} colors={props.colors} onClose={onClose} />
      <ReaderChaptersSheet
        visible={overlay === 'chapters'}
        chapters={props.chapters}
        currentIndex={props.chapterIndex}
        colors={props.colors}
        onClose={onClose}
        onSelect={props.onSelectChapter}
      />
      <ReportSheet
        visible={overlay === 'report'}
        onClose={onClose}
        target={{ type: 'story', targetId: story.id, reportedUserId: story.authorId }}
      />
      <AddToListSheet visible={overlay === 'list'} onClose={onClose} storyId={story.id} />
      <ShareStorySheet
        visible={overlay === 'share'}
        onClose={onClose}
        onShareLink={shareLink}
        story={{
          id: story.id,
          title: story.title,
          coverImage: story.coverImage,
          authorName: story.author?.displayName || story.author?.username,
        }}
      />
    </>
  );
}

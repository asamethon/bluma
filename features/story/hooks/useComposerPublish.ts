import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import i18n from '@/i18n';
import { challengeActions } from '@/store/challengeStore';
import type { Story } from '@/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { publishDraft } from '../services/chapterDraft';
import type { StudioChapter } from '../utils/chapterContent';

type Params = {
  storyId: string;
  story: Story | null;
  chapters: StudioChapter[];
  category: string;
  isPublished: boolean;
  beforePublish: () => void;
  onPublished: () => void;
};

/** Yayın akışı: eksik bilgi uyarısı → onay → yazma → kutlama ve değerlendirme. */
export function useComposerPublish(params: Params) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);

  const publish = () => {
    if (needsStoryInfo(params)) {
      Alert.alert(i18n.t('studio.completeInfoTitle'), i18n.t('studio.completeInfoMessage'), [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { text: i18n.t('studio.completeInfoAction'), onPress: () => router.push(`/story/edit/${params.storyId}`) },
      ]);
      return;
    }

    Alert.alert(
      i18n.t('studio.publishTitle'),
      i18n.t('studio.publishMessage', { title: params.story?.title }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { text: i18n.t('studio.publishAction'), onPress: () => void run() },
      ],
    );
  };

  const run = async () => {
    setPublishing(true);
    params.beforePublish();
    const result = await publishDraft(params.storyId, params.chapters);
    setPublishing(false);

    if (!result.success) {
      Alert.alert(i18n.t('common.error'), result.error || i18n.t('studio.publishFailed'));
      return;
    }

    const authorId = params.story?.authorId;
    const firstPublish = !params.isPublished && !!authorId;
    if (firstPublish) {
      challengeActions.trackAction(authorId!, 'storiesPublished').catch(() => {});
    }
    params.onPublished();

    // Değerlendirme, kendi uyarımız kapandıktan SONRA istenir ki iki diyalog
    // üst üste binmesin.
    const finish = (launch: boolean) => {
      router.replace(launch ? `/story/${params.storyId}/launch` as never : '/(tabs)');
      // Değerlendirme uyarısı lansman tasarımının üstüne binmemeli.
      if (firstPublish && !launch) {
        reviewPromptActions.recordMoment('storyPublished', { immediate: true }).catch(() => {});
      }
    };
    Alert.alert(i18n.t('studio.publishedTitle'), i18n.t('studio.publishedMessage'), [
      {
        text: i18n.t('launch.later'),
        style: 'cancel',
        onPress: () => finish(false),
      },
      { text: i18n.t('launch.makeLaunch'), onPress: () => finish(true) },
    ]);
  };

  return { publish, publishing };
}

function needsStoryInfo({ story, category }: Pick<Params, 'story' | 'category'>): boolean {
  const title = (story?.title || '').trim();
  return title.length < 3 || title === i18n.t('studio.untitledStory') || category === 'other';
}

import i18n from '@/i18n';
import { Story } from '@/types';
import * as Notifications from 'expo-notifications';
import { logger } from '@/utils/logger';

const FIRST_STORY_ID = 'writer-first-story';
const DRAFT_ID = 'writer-draft-reminder';
const DAY_SECONDS = 24 * 60 * 60;

export async function syncWriterReminders(stories: Story[]) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelScheduledNotificationAsync(FIRST_STORY_ID).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(DRAFT_ID).catch(() => {});

    if (stories.length === 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: FIRST_STORY_ID,
        content: {
          title: i18n.t('writerReminders.firstTitle'),
          body: i18n.t('writerReminders.firstBody'),
          data: { type: 'writer_nudge', route: '/(tabs)/write' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2 * DAY_SECONDS,
        },
      });
      return;
    }

    const draft = stories.find(s => !s.isPublished);
    if (draft) {
      await Notifications.scheduleNotificationAsync({
        identifier: DRAFT_ID,
        content: {
          title: i18n.t('writerReminders.draftTitle'),
          body: i18n.t('writerReminders.draftBody', { title: draft.title }),
          data: { type: 'writer_nudge', route: `/story/compose/${encodeURIComponent(draft.id)}?ch=0` },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: DAY_SECONDS,
        },
      });
    }
  } catch (e) {
    logger.error('syncWriterReminders error:', e);
  }
}

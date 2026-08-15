import i18n from '@/i18n';
import type { NotificationI18n } from '@/types';

type Localizable = {
  type?: string;
  title?: string;
  message?: string;
  senderName?: string;
  data?: (Record<string, any> & { i18n?: NotificationI18n }) | null;
};

type Params = Record<string, string | number>;

/** Parametrelerden biri eksikse tarif kullanılmaz (yarım cümle üretmemek için). */
function recipe(titleKey: string, messageKey: string, params: Params): NotificationI18n | null {
  const missing = Object.values(params).some(v => v === undefined || v === null || v === '');
  return missing ? null : { titleKey, messageKey, params };
}

/**
 * Tarif alanı eklenmeden önce yazılmış bildirimlerin metnini tür + veriden
 * yeniden kurar. Böylece eski kayıtlar da okuyanın dilinde görünür.
 */
function legacyRecipe(item: Localizable): NotificationI18n | null {
  const data = item.data ?? {};
  const name = item.senderName || data.authorName || '';
  const story = data.storyTitle || '';

  switch (item.type) {
    case 'follow':
      return recipe('notifications.newFollowerTitle', 'notifications.newFollowerMessage', { name });
    case 'follow_request':
      return recipe('notifications.followRequestTitle', 'notifications.followRequestMessage', { name });
    case 'follow_accepted':
      return recipe('notifications.followAcceptedTitle', 'notifications.followAcceptedMessage', { name });
    case 'like':
      // Bölüm beğenisinde bölüm indeksi taşınır.
      if (data.chapterIndex !== undefined) {
        return recipe('notifications.chapterLikedTitle', 'notifications.chapterLikedMessage', {
          name,
          story,
          chapter: Number(data.chapterIndex) + 1,
        });
      }
      return recipe('notifications.newLikeTitle', 'notifications.storyLikedMessage', { name, story });
    case 'comment':
      return recipe('notifications.newCommentTitle', 'notifications.storyCommentMessage', { name, story });
    case 'mention':
      return recipe('notifications.mentionTitle', 'notifications.mentionMessage', { name, story });
    case 'story_published':
      return recipe('notifications.newStoryTitle', 'notifications.newStoryMessage', { author: name, story });
    case 'new_chapter':
      return data.chapterNumber
        ? recipe('notifications.newChapterTitle', 'notifications.newChapterMessageNumbered', {
            author: name,
            story,
            chapter: Number(data.chapterNumber),
          })
        : recipe('notifications.newChapterTitle', 'notifications.newChapterMessage', { author: name, story });
    case 'conversation_announcement':
      return recipe('notifications.newConversationTitle', 'notifications.newConversationMessage', { name });
    case 'welcome':
      // Hoş geldin bildiriminde gönderen = alıcının kendisi.
      return recipe('notifications.welcomeTitle', 'notifications.welcomeMessage', { name });
    default:
      return null;
  }
}

/**
 * Bildirim metni GÖNDERENİN dilinde yazılıp saklanıyordu; alıcı başka bir dil
 * kullanıyorsa karışık görünüyordu. Metin artık OKUYAN cihazda üretilir:
 * önce dokümandaki tarif, yoksa türden çıkarılan tarif, o da olmazsa
 * dokümandaki yazılı metin kullanılır.
 */
export function localizeNotification(item: Localizable): { title: string; message: string } {
  const source = item?.data?.i18n ?? legacyRecipe(item ?? {});
  const params = (source?.params ?? {}) as Record<string, unknown>;
  const pick = (key: string | undefined, fallback?: string) =>
    key && i18n.exists(key) ? String(i18n.t(key, params as any)) : (fallback ?? '');

  return {
    title: pick(source?.titleKey, item?.title),
    message: pick(source?.messageKey, item?.message),
  };
}

import type { Notification } from '@/types';

type NotificationData = Notification['data'] & { type?: string; senderId?: string };
type Target = { kind: 'route'; value: string } | { kind: 'url'; value: string };

const segment = (value: unknown) => typeof value === 'string' && value.length > 0
  ? encodeURIComponent(value) : null;

const internalRoute = (value: unknown) => typeof value === 'string'
  && /^\/(?!\/)[a-zA-Z0-9_()/?=&%.-]+$/.test(value) ? value : null;

/** Liste ve push aynı bildirimden aynı hedefi üretir. */
export function notificationTarget(input: {
  type?: string;
  senderId?: string;
  data?: NotificationData | null;
}): Target | null {
  const { data } = input;
  const type = input.type || data?.type;
  const story = segment(data?.storyId);
  const conversation = segment(data?.conversationId);
  const sender = segment(data?.followerId || input.senderId || data?.senderId);
  const chapter = Number(data?.chapterIndex);
  const chapterIndex = data?.chapterIndex !== undefined && Number.isInteger(chapter) && chapter >= 0
    ? chapter : undefined;
  const chapterNumber = Number(data?.chapterNumber);
  const newChapterIndex = Number.isInteger(chapterNumber) && chapterNumber > 0
    ? chapterNumber - 1 : 0;
  const route = (value: string): Target => ({ kind: 'route', value });

  if (type === 'message' && sender) return route(`/messages/${sender}`);
  if (type === 'follow_request') return route('/profile/follow-requests');
  if ((type === 'follow' || type === 'follow_accepted') && sender) return route(`/user/${sender}`);
  if (type === 'verify_email') return route('/profile/verify-email');
  if (type === 'writer_nudge') return route(internalRoute(data?.route) || '/(tabs)/write');
  if (type === 'welcome') return route('/(tabs)/write');
  if (conversation && ['like', 'comment', 'conversation_announcement'].includes(type || '')) {
    return route(`/conversation/${conversation}`);
  }
  if (story && type === 'comment') {
    const suffix = chapterIndex === undefined ? '' : `?chapter=${chapterIndex}`;
    return route(`/story/${story}/comments${suffix}`);
  }
  if (story && type === 'new_chapter') return route(`/story/${story}?chapter=${newChapterIndex}`);
  if (story && type === 'like' && chapterIndex !== undefined) return route(`/story/${story}?chapter=${chapterIndex}`);
  if (story && ['like', 'story_published', 'mention'].includes(type || '')) {
    return route(`/story/${story}/preview`);
  }
  if (type === 'announcement') {
    if (typeof data?.url === 'string' && /^https?:\/\//i.test(data.url)) {
      return { kind: 'url', value: data.url };
    }
    return route(internalRoute(data?.route) || '/notifications');
  }
  const explicit = internalRoute(data?.route);
  if (explicit) return route(explicit);

  // Eski push kayıtlarında tür yoktu; eldeki bağlamla en yakın ekrana git.
  if (!type && conversation) return route(`/conversation/${conversation}`);
  if (!type && story) {
    if (data?.commentText) return route(`/story/${story}/comments`);
    if (data?.chapterNumber !== undefined) return route(`/story/${story}?chapter=${newChapterIndex}`);
    if (chapterIndex !== undefined) return route(`/story/${story}?chapter=${chapterIndex}`);
    return route(`/story/${story}/preview`);
  }
  if (!type && sender) return route(`/user/${sender}`);
  return null;
}

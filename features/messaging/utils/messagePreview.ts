import i18n from '@/i18n';
import type { DirectMessage } from '@/types';

export function messagePreviewText(message: Pick<DirectMessage, 'text' | 'story' | 'voice' | 'gif' | 'viewOnce' | 'image'>) {
  if (message.text) return message.text;
  if (message.story) return i18n.t('messages.sharedStoryPreview');
  if (message.voice) return i18n.t('messages.voicePreview');
  if (message.gif) return i18n.t(message.gif.sticker ? 'messages.stickerPreview' : 'messages.gifPreview');
  if (message.viewOnce) return i18n.t('messages.viewOncePreview');
  if (message.image) return i18n.t('messages.photoPreview');
  return '';
}

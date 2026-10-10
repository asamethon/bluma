import i18n from '@/i18n';
import type { DirectMessage, MessageReply } from '@/types';

/** Alıntı satırı bir cümleyi geçmez; baloncuğu şişirmesin. */
const SNIPPET_LIMIT = 140;

const kindOf = (message: DirectMessage): MessageReply['kind'] => {
  if (message.viewOnce) return 'viewOnce';
  if (message.voice) return 'voice';
  if (message.gif) return message.gif.sticker ? 'sticker' : 'gif';
  if (message.story) return 'story';
  if (message.image) return 'image';
  return 'text';
};

/** Yanıtlanan mesajın baloncukta saklanacak özeti. */
export function toReplySnippet(message: DirectMessage): MessageReply {
  const kind = kindOf(message);
  const fallback = {
    viewOnce: 'messages.viewOncePreview',
    voice: 'messages.voicePreview',
    gif: 'messages.gifPreview',
    sticker: 'messages.stickerPreview',
    story: 'messages.sharedStoryPreview',
    image: 'messages.photoPreview',
    text: '',
  }[kind];
  const text = message.text?.trim() || (fallback ? i18n.t(fallback) : '');
  return {
    id: message.id,
    senderId: message.senderId,
    kind,
    text: text.length > SNIPPET_LIMIT ? `${text.slice(0, SNIPPET_LIMIT - 1).trimEnd()}…` : text,
  };
}

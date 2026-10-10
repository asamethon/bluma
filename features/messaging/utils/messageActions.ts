import { EDIT_WINDOW_MS } from '@/features/messaging/services/messagingService';
import { toMillis } from '@/features/messaging/utils/time';
import type { DirectMessage } from '@/types';
import type { TFunction } from 'i18next';

export type MessageActionId = 'reply' | 'edit' | 'info' | 'hide' | 'delete';

export type MessageActionItem = {
  id: MessageActionId;
  label: string;
  /** iOS'ta SF Symbol; Android'de yalnızca metin görünür. */
  symbol: string;
  danger?: boolean;
};

/** Metin mesajı, benim ve düzenleme süresi dolmamışsa düzenlenebilir. */
const canEdit = (message: DirectMessage, mine: boolean) =>
  mine && !message.deletedAt && !message.pending && !!message.text
  && !message.image && !message.voice && !message.gif && !message.story
  && Date.now() - toMillis(message.createdAt) < EDIT_WINDOW_MS;

/** Menü içeriği mesajın sahibine, türüne ve yaşına göre değişir. */
export function buildMessageActions(
  message: DirectMessage,
  mine: boolean,
  t: TFunction,
): MessageActionItem[] {
  const own = mine && !message.pending;
  return [
    ...(message.deletedAt
      ? []
      : [{ id: 'reply' as const, label: t('messages.reply'), symbol: 'arrowshape.turn.up.left' }]),
    ...(canEdit(message, mine)
      ? [{ id: 'edit' as const, label: t('messages.edit'), symbol: 'pencil' }]
      : []),
    ...(own ? [{ id: 'info' as const, label: t('messages.info'), symbol: 'info.circle' }] : []),
    { id: 'hide', label: t('messages.deleteForMe'), symbol: 'eye.slash', danger: true },
    ...(own && !message.deletedAt
      ? [{ id: 'delete' as const, label: t('messages.deleteForEveryone'), symbol: 'trash', danger: true }]
      : []),
  ];
}

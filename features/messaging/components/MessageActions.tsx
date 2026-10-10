import { Radius, useTheme } from '@/constants/theme';
import { buildMessageActions, type MessageActionId } from '@/features/messaging/utils/messageActions';
import type { DirectMessage } from '@/types';
import { BlumaContextMenu, isContextMenuAvailable } from '@/modules/bluma-context-menu';
import { MenuView } from '@react-native-menu/menu';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

export type MessageActionHandlers = {
  onReply: (message: DirectMessage) => void;
  onEdit: (message: DirectMessage) => void;
  onInfo: (message: DirectMessage) => void;
  onHide: (message: DirectMessage) => void;
  onDelete: (message: DirectMessage) => void;
};

type Props = {
  message: DirectMessage;
  mine: boolean;
  handlers: MessageActionHandlers;
  children: React.ReactNode;
};

/**
 * Basılı tutunca işletim sisteminin kendi menüsü açılır.
 *
 * iOS'ta yerel `modules/bluma-context-menu` kullanılır: `UIContextMenuInteraction`
 * + `UITargetedPreview` sayesinde baloncuğun KENDİSİ kaldırılıp büyütülür ve
 * arka plan bulanıklaşır (WhatsApp davranışı). Android'de sistemin `PopupMenu`'sü.
 *
 * Sarmalayıcı BALONCUĞU sarar, satırın tamamını değil — hem menü ona tutturulur
 * hem de kalkan şey tam olarak baloncuk olur.
 */
export function MessageActions({ message, mine, handlers, children }: Props) {
  const { scheme, colors: palette } = useTheme();
  const { t } = useTranslation();
  const items = buildMessageActions(message, mine, t);

  const run = (id: string) => {
    const map: Record<MessageActionId, (message: DirectMessage) => void> = {
      reply: handlers.onReply,
      edit: handlers.onEdit,
      info: handlers.onInfo,
      hide: handlers.onHide,
      delete: handlers.onDelete,
    };
    map[id as MessageActionId]?.(message);
  };

  // Native modül derlemede yoksa (eski binary, eksik dosya) `BlumaContextMenu`
  // null'dur — o zaman sistem menüsüne düşülür, kırık kutu gösterilmez.
  if (Platform.OS === 'ios' && isContextMenuAvailable && BlumaContextMenu) {
    return (
      <BlumaContextMenu
        cornerRadius={Radius.lg}
        actions={items.map(item => ({
          key: item.id,
          title: item.label,
          systemIcon: item.symbol,
          destructive: item.danger,
        }))}
        onSelectAction={({ nativeEvent }) => {
          // UIKit kaldırdığı balonu yerine koyunca görüntüsünü yakalayabiliriz.
          if (nativeEvent.key === 'hide') setTimeout(() => run(nativeEvent.key), 320);
          else run(nativeEvent.key);
        }}
      >
        {children}
      </BlumaContextMenu>
    );
  }

  return (
    <MenuView
      shouldOpenOnLongPress
      themeVariant={scheme}
      actions={items.map(item => ({
        id: item.id,
        title: item.label,
        imageColor: item.danger ? palette.error : palette.text,
        attributes: { destructive: item.danger },
      }))}
      onPressAction={({ nativeEvent }) => run(nativeEvent.event)}
    >
      {children}
    </MenuView>
  );
}

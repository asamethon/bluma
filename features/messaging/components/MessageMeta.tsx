import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { formatClock } from '@/features/messaging/utils/time';
import { MessageStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const ICON: Record<MessageStatus, 'time-outline' | 'checkmark' | 'checkmark-done'> = {
  sending: 'time-outline',
  sent: 'checkmark',
  delivered: 'checkmark-done',
  read: 'checkmark-done',
};

// Baloncuğun sağ alt köşesi: saat + (yalnızca kendi mesajlarımda) durum tiki.
// onBubble=false → hikâye kartı gibi kendi zemini olan içeriklerin altında,
// ekran arka planı üzerinde çizilir.
function MessageMetaBase({
  createdAt,
  status,
  mine,
  edited,
  onBubble = true,
}: {
  createdAt: any;
  status?: MessageStatus;
  mine: boolean;
  edited?: boolean;
  onBubble?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const time = formatClock(createdAt);
  const onOwnBubble = onBubble && mine;
  const base = onOwnBubble ? colors.onPrimary : colors.textLight;
  const tickColor = status === 'read' ? colors.readTick : base;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        marginTop: 3,
      }}
    >
      <Text
        variant="caption"
        color={base}
        style={{ fontSize: 10.5, lineHeight: 14, opacity: onOwnBubble ? 0.75 : 1 }}
      >
        {edited ? `${t('messages.edited')} · ${time}` : time}
      </Text>
      {!!status && (
        <Ionicons
          name={ICON[status]}
          size={status === 'sending' ? 11 : 14}
          color={tickColor}
          // Soluk çift tik: teslim edildi ama henüz okunmadı.
          style={{ opacity: status === 'read' ? 1 : 0.75 }}
        />
      )}
    </View>
  );
}

export const MessageMeta = React.memo(MessageMetaBase);

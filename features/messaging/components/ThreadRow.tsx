import { Avatar, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { formatThreadTime } from '@/features/messaging/utils/time';
import { MessageThread } from '@/types';
import React from 'react';
import { Pressable, View } from 'react-native';

// Mesajlar kutusundaki tek sohbet satırı. React.memo + stabil onPress ile
// liste yeniden render'da hafif kalır.
function ThreadRowBase({
  thread,
  currentUserId,
  onPress,
}: {
  thread: MessageThread;
  currentUserId?: string;
  onPress: (otherUserId: string) => void;
}) {
  const { colors } = useTheme();
  const other = thread.otherUser;
  const otherId = thread.participants.find((p) => p !== currentUserId);
  const unread = thread.unread > 0;
  const fromMe = thread.lastMessage?.senderId === currentUserId;

  return (
    <Pressable
      onPress={() => otherId && onPress(otherId)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 2 }}
      android_ripple={{ color: colors.surfaceVariant }}
    >
      <Avatar uri={other?.profileImage} name={other?.displayName} size={52} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={{ flex: 1, fontWeight: unread ? '800' : '700' }}
          >
            {other?.displayName || 'Kullanıcı'}
          </Text>
          <Text variant="caption" color={unread ? colors.primary : colors.textLight} style={{ fontWeight: '600' }}>
            {formatThreadTime(thread.lastMessage?.createdAt)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text
            variant="body"
            numberOfLines={1}
            color={unread ? colors.text : colors.textLight}
            style={{ flex: 1, fontSize: 13, fontWeight: unread ? '600' : '400' }}
          >
            {fromMe ? 'Sen: ' : ''}
            {thread.lastMessage?.text || 'Sohbeti başlat'}
          </Text>
          {unread && (
            <View
              style={{
                minWidth: 18,
                height: 18,
                paddingHorizontal: 5,
                borderRadius: 9,
                backgroundColor: colors.bloom,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10.5, lineHeight: 14, fontWeight: '800' }}>{thread.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const ThreadRow = React.memo(ThreadRowBase);

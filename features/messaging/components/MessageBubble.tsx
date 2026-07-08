import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { formatMessageStamp } from '@/features/messaging/utils/time';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

// Tek mesaj balonu. Bana ait → sağda, primary; karşıya ait → solda, sunk yüzey.
// showStamp ise üstte ortalanmış gün/saat ayracı.
function MessageBubbleBase({
  text,
  image,
  mine,
  showStamp,
  stampTs,
  onImagePress,
}: {
  text: string;
  image?: string;
  mine: boolean;
  showStamp: boolean;
  stampTs?: any;
  onImagePress?: (uri: string) => void;
}) {
  const { colors, shadows } = useTheme();

  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      {showStamp && (
        <Text
          variant="caption"
          color={colors.textLight}
          style={{ alignSelf: 'center', fontWeight: '600', marginTop: 6, marginBottom: 10 }}
        >
          {formatMessageStamp(stampTs)}
        </Text>
      )}
      <View
        style={[
          {
            maxWidth: '78%',
            paddingVertical: image ? 6 : 10,
            paddingHorizontal: image ? 6 : 14,
            marginBottom: 4,
            backgroundColor: mine ? colors.primary : colors.surfaceVariant,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderBottomLeftRadius: mine ? 18 : 4,
            borderBottomRightRadius: mine ? 4 : 18,
          },
          mine ? shadows.sm : null,
        ]}
      >
        {image && (
          <Pressable onPress={() => onImagePress?.(image)}>
            <Image
              source={{ uri: image }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 14,
                marginBottom: text ? 6 : 0,
              }}
              contentFit="cover"
            />
          </Pressable>
        )}
        {!!text && (
          <Text
            variant="body"
            color={mine ? colors.onPrimary : colors.text}
            style={{ fontSize: 14.5, lineHeight: 21, paddingHorizontal: image ? 8 : 0, paddingBottom: image ? 4 : 0 }}
          >
            {text}
          </Text>
        )}
      </View>
    </View>
  );
}

export const MessageBubble = React.memo(MessageBubbleBase);

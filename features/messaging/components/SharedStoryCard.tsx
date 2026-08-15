import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { SharedStory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

function SharedStoryCardBase({
  story,
  mine,
  onPress,
}: {
  story: SharedStory;
  mine: boolean;
  onPress?: (storyId: string) => void;
}) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onPress?.(story.id)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          width: 250,
          padding: 10,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: mine ? 'transparent' : colors.border,
        },
        shadows.sm,
      ]}
    >
      {story.coverImage ? (
        <Image
          source={{ uri: story.coverImage }}
          style={{ width: 48, height: 66, borderRadius: 8, backgroundColor: colors.surfaceVariant }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 66,
            borderRadius: 8,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="book" size={22} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="caption" color={colors.primary} style={{ fontWeight: '700', marginBottom: 2 }}>
          {t('common.story')}
        </Text>
        <Text variant="body" color={colors.text} numberOfLines={2} style={{ fontWeight: '600', lineHeight: 19 }}>
          {story.title}
        </Text>
        {!!story.authorName && (
          <Text variant="caption" color={colors.textLight} numberOfLines={1} style={{ marginTop: 2 }}>
            {story.authorName}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </Pressable>
  );
}

export const SharedStoryCard = React.memo(SharedStoryCardBase);

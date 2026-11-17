import { Divider, IconButton, Text } from '@/components/ui';
import { safeCount } from '@/utils/format';
import { Motion, Radius, Spacing, useTheme } from '@/constants/theme';
import { boardByline, isBoardGuestPost } from '@/features/conversation/utils/boardPost';
import { Conversation } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

interface ProfileConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  onImagePress: (imageUri: string) => void;
  /** Sil / şikâyet menüsü; yetki yoksa hiç verilmez. */
  onMenu?: () => void;
}

/** Profil akışındaki paylaşım — kart çerçevesi yok, hairline ayraçlı bir giriş. */
export function ProfileConversationCard({
  conversation,
  onPress,
  onImagePress,
  onMenu,
}: ProfileConversationCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // Gönderi başka birinin panosunda duruyorsa hedef künyede gösterilir.
  const byline = isBoardGuestPost(conversation)
    ? boardByline(conversation, t('common.user'))
    : null;

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? Motion.pressOpacity : 1 }]}
        onPress={onPress}
      >
        {byline && <Text variant="caption" tone="textLight">{byline}</Text>}
        <Text variant="body">{conversation.content}</Text>

        {conversation.image && (
          <Pressable onPress={() => onImagePress(conversation.image!)}>
            <Image
              source={{ uri: conversation.image }}
              style={[styles.img, { backgroundColor: colors.surfaceVariant }]}
              contentFit="cover"
            />
          </Pressable>
        )}

        <View style={styles.stats}>
          <Stat icon="heart-outline" value={safeCount(conversation.likesCount)} />
          <Stat icon="chatbubble-outline" value={safeCount(conversation.commentsCount)} />
          {onMenu && (
            <IconButton
              icon="ellipsis-horizontal"
              size={28}
              iconSize={16}
              color={colors.textLight}
              onPress={onMenu}
              style={styles.menu}
            />
          )}
        </View>
      </Pressable>
      <Divider />
    </View>
  );
}

function Stat({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={colors.textLight} />
      <Text variant="caption" tone="textLight">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: Spacing.lg, gap: Spacing.sm },
  img: { width: '100%', height: 170, borderRadius: Radius.md },
  stats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  menu: { marginLeft: 'auto', marginRight: -6 },
});

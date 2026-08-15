import { Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Conversation } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfileConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  onImagePress: (imageUri: string) => void;
  onDelete?: () => void;
}

export function ProfileConversationCard({ conversation, onPress, onImagePress, onDelete }: ProfileConversationCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text variant="body" style={{ flex: 1 }}>{conversation.content}</Text>
      {conversation.image && (
        <TouchableOpacity onPress={() => onImagePress(conversation.image!)}>
          <Image source={{ uri: conversation.image }} style={styles.img} contentFit="cover" />
        </TouchableOpacity>
      )}
      <View style={styles.stats}>
        <StatPill icon="heart-outline" value={conversation.likesCount || 0} color={colors.textSecondary} />
        <StatPill icon="chatbubble-outline" value={conversation.commentsCount || 0} color={colors.textSecondary} />
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={{ marginLeft: 'auto' }}>
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function StatPill({ icon, value, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={14} color={color} />
      <Text variant="caption" tone="textSecondary">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  img: {
    width: '100%',
    height: 150,
    borderRadius: Radius.md,
    marginTop: 8,
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
});

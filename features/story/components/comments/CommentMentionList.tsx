import { Image } from 'expo-image';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import type { User } from '@/types';

type Props = {
  suggestions: User[];
  visible: boolean;
  onSelect: (username: string) => void;
};

export function CommentMentionList({ suggestions, visible, onSelect }: Props) {
  const { colors } = useTheme();
  console.log('[MENTION_LIST] render', { visible, count: suggestions.length });
  if (!visible || suggestions.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 72,
        left: 12,
        right: 12,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        maxHeight: 220,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.username || '')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, overflow: 'hidden', backgroundColor: colors.surfaceVariant }}>
              {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={{ width: 34, height: 34 }} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }} numberOfLines={1}>{item.displayName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

import { Radius, Spacing, useTheme } from '@/constants/theme';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  suggestions: User[];
  visible: boolean;
  onSelect: (username: string) => void;
};

type RowProps = {
  user: User;
  onPress: (username: string) => void;
};

const MentionRow = memo(function MentionRow({ user, onPress }: RowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(user.username || '')}
    >
      <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={16} color={colors.primary} />
        )}
      </View>
      <View style={styles.texts}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {user.displayName || user.username}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

/** Yorum yazarken "@" sonrası çıkan kullanıcı önerileri. */
export function CommentMentionList({ suggestions, visible, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (!visible || suggestions.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('commentsScreen.mentionHint')}</Text>
      <FlatList
        data={suggestions}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <MentionRow user={item} onPress={onSelect} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: 232,
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 8,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 34, height: 34 },
  texts: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600' },
  username: { fontSize: 12, marginTop: Radius.xs / 4 },
});

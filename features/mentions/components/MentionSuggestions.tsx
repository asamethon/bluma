import { Avatar, Text } from '@/components/ui';
import { Motion, Spacing, useTheme } from '@/constants/theme';
import type { User } from '@/types';
import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  suggestions: User[];
  onSelect: (username: string) => void;
  style?: StyleProp<ViewStyle>;
};

const MentionRow = memo(function MentionRow({ user, onSelect }: { user: User; onSelect: (username: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? Motion.pressOpacity : 1 }]}
      onPress={() => onSelect(user.username || '')}
    >
      <Avatar uri={user.profileImage} name={user.displayName} size={32} />
      <View style={styles.texts}>
        <Text variant="labelSm" numberOfLines={1}>{user.displayName || user.username}</Text>
        <Text variant="caption" tone="textSecondary" numberOfLines={1}>@{user.username}</Text>
      </View>
    </Pressable>
  );
});

/**
 * `@` sonrası kişi önerileri. En fazla 6 satır olduğu için düz liste: kaydırma
 * görünümünün (ScrollView) içinde de güvenle kullanılır.
 */
export function MentionSuggestions({ suggestions, onSelect, style }: Props) {
  const { colors } = useTheme();
  if (!suggestions.length) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.divider }, style]}>
      {suggestions.map(user => <MentionRow key={user.id} user={user} onSelect={onSelect} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 8,
  },
  texts: { flex: 1, minWidth: 0 },
});

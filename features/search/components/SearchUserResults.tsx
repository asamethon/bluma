import { Avatar, Text } from '@/components/ui';
import { FollowButton } from '@/features/social/components/FollowButton';
import { useTheme } from '@/constants/theme';
import type { User } from '@/types';
import { Pressable, View } from 'react-native';
import { searchStyles as styles } from '../styles/searchStyles';

type Props = { users: User[]; onOpen: (userId: string, position: number) => void };

export function SearchUserResults({ users, onOpen }: Props) {
  const { colors } = useTheme();
  if (users.length === 0) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      {users.map((user, index) => (
        <View key={user.id}>
          <Pressable style={styles.userRow} onPress={() => onOpen(user.id, index)}>
            <Avatar uri={user.profileImage} name={user.displayName} size={50} />
            <View style={styles.userIdentity}>
              <Text variant="subheading" numberOfLines={1}>{user.displayName}</Text>
              <Text variant="caption" tone="primary">@{user.username || 'user'}</Text>
            </View>
            <FollowButton userId={user.id} source="search" />
          </Pressable>
          {index < users.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 62 }]} />
          )}
        </View>
      ))}
    </View>
  );
}

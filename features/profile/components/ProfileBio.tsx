import { Text } from '@/components/ui';
import { Motion } from '@/constants/theme';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';

/** Uzun biyografi künyeyi şişirmesin: dört satırda kesilir, dokununca açılır. */
const CLAMP_AT = 140;

export function ProfileBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const clampable = bio.length > CLAMP_AT;

  const body = (
    <Text
      variant="body"
      tone="textSecondary"
      style={styles.bio}
      numberOfLines={clampable && !expanded ? 4 : undefined}
    >
      {bio}
    </Text>
  );

  if (!clampable) return body;
  return (
    <Pressable
      onPress={() => setExpanded(value => !value)}
      accessibilityRole="button"
      style={({ pressed }) => (pressed ? { opacity: Motion.pressOpacity } : undefined)}
    >
      {body}
    </Pressable>
  );
}

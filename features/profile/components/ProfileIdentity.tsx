import { Badge, Text } from '@/components/ui';
import type { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileBio } from './ProfileBio';

type Props = {
  name?: string;
  handle: string;
  badge?: { label: string; icon?: keyof typeof Ionicons.glyphMap };
  bio?: string;
};

/**
 * Profil kimlik künyesi: ad, @kullanıcı + rozet, biyografi. Kendi profilim ve
 * başkasının profili aynı ritmi paylaşsın diye tek bileşende durur.
 */
export function ProfileIdentity({ name, handle, badge, bio }: Props) {
  return (
    <View style={styles.identity}>
      <Text variant="title">{name}</Text>
      <View style={styles.metaRow}>
        <Text variant="label" tone="primary">@{handle}</Text>
        {badge ? <Badge label={badge.label} tone="primary" icon={badge.icon} /> : null}
      </View>
      {bio ? <ProfileBio bio={bio} /> : null}
    </View>
  );
}

/** `@kullanıcı` künyesi için güvenli isim: username → e-posta yerel kısmı. */
export const profileHandle = (username?: string, email?: string) =>
  username || email?.split('@')[0] || 'user';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { Ionicons } from '@expo/vector-icons';
import { Ionicons as IoniconsIcon } from '@expo/vector-icons';
import { Linking, TouchableOpacity, View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileBio } from './ProfileBio';

type Props = {
  name?: string;
  handle: string;
  badge?: { label: string; icon?: keyof typeof Ionicons.glyphMap };
  bio?: string;
  website?: string;
  location?: string;
};

/**
 * Profil kimlik künyesi: ad, @kullanıcı + rozet, biyografi. Kendi profilim ve
 * başkasının profili aynı ritmi paylaşsın diye tek bileşende durur.
 */
export function ProfileIdentity({ name, handle, badge, bio, website, location }: Props) {
  const { colors } = useTheme();

  const openWebsite = () => {
    if (!website) return;
    let url = website.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.identity}>
      <Text variant="title">{name}</Text>
      <View style={styles.metaRow}>
        <Text variant="label" tone="primary">@{handle}</Text>
        {badge ? <Badge label={badge.label} tone="primary" icon={badge.icon} /> : null}
      </View>
      {bio ? <ProfileBio bio={bio} /> : null}
      {(location || website) ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          {location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IoniconsIcon name="location-outline" size={14} color={colors.textSecondary} />
              <Text variant="caption" tone="textSecondary">{location}</Text>
            </View>
          ) : null}
          {website ? (
            <TouchableOpacity onPress={openWebsite} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IoniconsIcon name="link-outline" size={14} color={colors.primary} />
              <Text variant="caption" color={colors.primary} numberOfLines={1}>{website}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Kullanıcı adı eksikse e-postadan herkese açık kimlik türetilmez. */
export const profileHandle = (username?: string) => username || 'kullanici';

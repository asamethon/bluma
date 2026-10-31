import { Badge, Text } from '@/components/ui';
import { Motion, useTheme } from '@/constants/theme';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { profileWebsite } from '../utils/profileWebsite';
import { ProfileBio } from './ProfileBio';

type Props = {
  name?: string;
  handle: string;
  badge?: { label: string; icon?: keyof typeof Ionicons.glyphMap };
  bio?: string;
  location?: string;
  website?: string;
};

/**
 * Profil kimlik künyesi: ad, @kullanıcı + rozet, biyografi, konum ve web
 * sitesi. Kendi profilim ve başkasının profili aynı ritmi paylaşsın diye tek
 * bileşende durur. (Konum ve web sitesi düzenlenebiliyordu ama hiçbir yerde
 * gösterilmiyordu.)
 */
export function ProfileIdentity({ name, handle, badge, bio, location, website }: Props) {
  const { colors } = useTheme();
  const site = profileWebsite(website);
  const place = location?.trim();

  return (
    <View style={styles.identity}>
      <Text variant="title">{name}</Text>
      <View style={styles.metaRow}>
        <Text variant="label" tone="primary">@{handle}</Text>
        {badge ? <Badge label={badge.label} tone="primary" icon={badge.icon} /> : null}
      </View>
      {bio ? <ProfileBio bio={bio} /> : null}
      {place || site ? (
        <View style={styles.linksRow}>
          {place ? (
            <View style={styles.linkItem}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text variant="caption" tone="textSecondary" numberOfLines={1}>{place}</Text>
            </View>
          ) : null}
          {site ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL(site.url).catch(error => logger.debug('Web sitesi açılamadı:', error))}
              style={({ pressed }) => [styles.linkItem, { opacity: pressed ? Motion.pressOpacity : 1 }]}
            >
              <Ionicons name="link-outline" size={14} color={colors.primary} />
              <Text variant="caption" tone="primary" numberOfLines={1}>{site.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Kullanıcı adı eksikse e-postadan herkese açık kimlik türetilmez. */
export const profileHandle = (username?: string) =>
  username || i18n.t('common.user').toLocaleLowerCase();

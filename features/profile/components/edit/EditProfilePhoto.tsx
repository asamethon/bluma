import { Avatar, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { createEditProfileStyles } from '../../styles/editProfileStyles';

type Props = {
  image: string | null;
  coverImage: string | null;
  name: string;
  onAvatarPress: () => void;
  onCoverPress: () => void;
};

export function EditProfilePhoto({ image, coverImage, name, onAvatarPress, onCoverPress }: Props) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const styles = createEditProfileStyles(colors);
  return (
    <View style={styles.photoSection}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onCoverPress}
        style={styles.coverPicker}
        accessibilityRole="button"
        accessibilityLabel={t('coverPicker.title')}
      >
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.coverImage} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={25} color={colors.textLight} />
            <Text variant="label" tone="textSecondary">{t('coverPicker.title')}</Text>
          </View>
        )}
        <View style={[styles.coverEditBadge, shadows.sm]}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={onAvatarPress} style={styles.avatarWrap}>
        {/* Profil ekranıyla aynı dil: yuvarlak köşeli kare, pembe çember yok. */}
        <Avatar uri={image || undefined} name={name} size={104} shape="rounded" />
        <View style={[styles.editBadge, shadows.sm]}><Ionicons name="camera" size={16} color="#fff" /></View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAvatarPress} style={styles.photoLabel}>
        <Text variant="label" tone="primary">
          {image ? t('editProfile.changePhoto') : t('profileScreen.addPhoto')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

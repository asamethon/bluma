import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';

/** Konuşma sekmesinin başındaki "bir mesaj yaz" davetiyesi. */
export function ProfileComposePrompt({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.composeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text variant="body" tone="textSecondary" style={styles.composeHint}>
          {t('profileScreen.writeAMessage')}
        </Text>
        <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

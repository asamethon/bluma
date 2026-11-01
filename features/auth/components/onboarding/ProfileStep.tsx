import { Text } from '@/components/ui';
import { USERNAME_MAX_LENGTH } from '@/features/auth/utils/usernameNormalize';
import { useTheme } from '@/constants/theme';
import type { OnboardingUsernameStatus } from '@/features/auth/hooks/useOnboardingForm';
import { UsernameSuggestions } from '@/features/profile/components/UsernameSuggestions';
import { useUsernameSuggestions } from '@/features/profile/hooks/useUsernameSuggestions';
import { assessUsername } from '@/features/profile/utils/usernameAssess';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { onboardingStyles as styles } from '../../styles/onboardingStyles';

type Props = {
  avatar: string | null;
  displayName: string;
  username: string;
  status: OnboardingUsernameStatus;
  onAvatar: () => void;
  onDisplayName: (value: string) => void;
  onUsername: (value: string) => void;
};

export function ProfileStep(props: Props) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  // Alan boşken ilk müsait öneriyi göster; yazılan ad gürültülüyse ipucuyla birlikte.
  // Müsaitlik sorgusu yalnızca öneri gösterilecekse atılır — boşa okuma yok.
  const assessment = assessUsername(props.username, props.displayName);
  const showSuggestions = !props.username || assessment.flagged;
  const suggestions = useUsernameSuggestions(props.displayName, props.username, showSuggestions);
  const statusMeta = props.status === 'checking'
    ? { icon: 'time-outline' as const, color: colors.textSecondary, text: t('onboarding.checking') }
    : props.status === 'available'
      ? { icon: 'checkmark-circle' as const, color: colors.success, text: t('onboarding.usernameAvailable', { username: props.username }) }
      : props.status === 'taken'
        ? { icon: 'close-circle' as const, color: colors.error, text: t('onboarding.usernameTaken', { username: props.username }) }
        : null;
  return (
    <View style={styles.profileStep}>
      <TouchableOpacity style={styles.avatarWrap} onPress={props.onAvatar} activeOpacity={0.85}>
        <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}22`, borderColor: `${colors.primary}44` }]}>
          {props.avatar ? (
            <Image source={{ uri: props.avatar }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.primary, fontFamily: fonts.serif }]}>
              {props.displayName ? props.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          )}
        </View>
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Ionicons name="camera" size={15} color="#fff" />
        </View>
      </TouchableOpacity>
      <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Ionicons name="happy-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.textInput, { color: colors.text, fontFamily: fonts.sans }]}
          placeholder={t('onboarding.displayNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={props.displayName}
          onChangeText={props.onDisplayName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <View>
        <View style={[
          styles.inputRow,
          { backgroundColor: colors.surfaceVariant, borderColor: props.status === 'available' ? colors.success : colors.border },
        ]}>
          <Text style={[styles.atPrefix, { color: colors.primary, fontFamily: fonts.sans }]}>@</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, fontFamily: fonts.sans }]}
            placeholder={(!props.username && suggestions[0]) || t('onboarding.usernamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={props.username}
            onChangeText={props.onUsername}
            maxLength={USERNAME_MAX_LENGTH}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text variant="caption" tone="textSecondary" style={styles.usernameHint}>
          {t('onboarding.usernameHint', { length: props.username.length })}
        </Text>
        {props.username.length >= 3 && statusMeta && (
          <View style={styles.usernameStatus}>
            <Ionicons name={statusMeta.icon} size={16} color={statusMeta.color} />
            <Text variant="caption" style={{ color: statusMeta.color }}>{statusMeta.text}</Text>
          </View>
        )}
        <UsernameSuggestions
          reason={assessment.reason}
          suggestions={suggestions}
          onPick={props.onUsername}
        />
      </View>
    </View>
  );
}

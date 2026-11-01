import { Chip, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { UsernameFlagReason } from '../utils/usernameAssess';

type Props = {
  reason?: UsernameFlagReason;
  suggestions: string[];
  onPick: (username: string) => void;
};

/**
 * Kullanıcı adı alanının altındaki tek satır yumuşak ipucu + öneri çipleri.
 * Kayıt ve profil düzenleme aynı parçayı kullanır.
 *
 * Metin kural değil fayda anlatır ve @bahsetmeye bağlanır; "geçersiz" ya da
 * benzeri bir yargı kullanılmaz. Önerisi olmayan durumda yalnızca ipucu kalır
 * (görünen ad da gürültülüyse önerecek temiz bir ad yok).
 */
export function UsernameSuggestions({ reason, suggestions, onPick }: Props) {
  const { t } = useTranslation();
  if (!reason && !suggestions.length) return null;

  return (
    <View style={styles.root}>
      {!!reason && (
        <Text variant="caption" tone="textSecondary">
          {reason === 'mangled' ? t('username.hintMangled') : t('username.hintGeneric')}
        </Text>
      )}
      {!!suggestions.length && (
        <View style={styles.chips}>
          {suggestions.map(suggestion => (
            <Chip key={suggestion} label={`@${suggestion}`} onPress={() => onPick(suggestion)} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.sm, marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});

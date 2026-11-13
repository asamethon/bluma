import { Badge } from '@/components/ui';
import { Motion } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { isFounder } from '../constants';

/**
 * İlk bin üyenin kalıcı rozeti. Kendi profilinde dokununca 1K kartını açar;
 * başkasının profilinde yalnızca etikettir.
 */
export function FounderBadge({ memberNumber, interactive = false }: { memberNumber?: number; interactive?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  if (!isFounder(memberNumber)) return null;
  const badge = <Badge label={t('milestone.founder')} tone="gold" icon="sparkles" />;
  if (!interactive) return badge;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('milestone.founder')}
      hitSlop={8}
      onPress={() => router.push('/milestone' as never)}
      style={({ pressed }) => ({ opacity: pressed ? Motion.pressOpacity : 1 })}
    >
      {badge}
    </Pressable>
  );
}

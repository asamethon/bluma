import ReportSheet from '@/features/moderation/components/ReportSheet';
import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { userProfileStyles as styles } from '../styles/userProfileStyles';

type Props = {
  user: User;
  /** Menü, üç nokta düğmesinin altına açılır — güvenli alan ekrandan gelir. */
  top: number;
  blocked: boolean;
  menuVisible: boolean;
  reportVisible: boolean;
  onCloseMenu: () => void;
  onReport: () => void;
  onCloseReport: () => void;
  onToggleBlock: () => void;
};

export function UserProfileMenu(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      {props.menuVisible && (
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={props.onCloseMenu}>
          <View style={[styles.menuCard, { top: props.top, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={props.onReport}>
              <Ionicons name="flag-outline" size={18} color={colors.text} />
              <Text variant="body">{t('report.targetUser')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={props.onToggleBlock}>
              <Ionicons
                name={props.blocked ? 'person-add-outline' : 'person-remove-outline'}
                size={18}
                color={props.blocked ? colors.text : colors.error}
              />
              <Text variant="body" color={props.blocked ? colors.text : colors.error}>
                {props.blocked ? t('userProfile.unblock') : t('userProfile.block')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      <ReportSheet
        visible={props.reportVisible}
        onClose={props.onCloseReport}
        target={{ type: 'user', targetId: props.user.id, reportedUserId: props.user.id }}
      />
    </>
  );
}

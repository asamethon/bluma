import { SegmentedControl } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { View } from 'react-native';
import { TABS_PAD_FLOW, TABS_PAD_PINNED } from '../profileLayout';
import type { ProfileTab } from '../profileRows';
import { profileStyles as styles } from '../styles/profileStyles';

type Props = {
  storiesLabel: string;
  conversationsLabel: string;
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  /** Yapışkan şeridin içindeyken üst boşluk daralır. */
  pinned?: boolean;
};

/**
 * Sekme şeridi. Aynı bileşen hem akışta hem yapışkan başlıkta kullanılır;
 * devir teslim göze çarpmasın diye zemini opaktır.
 */
export function ProfileTabsRow({ storiesLabel, conversationsLabel, value, onChange, pinned }: Props) {
  const { colors } = useTheme();
  const options = [
    { value: 'stories', label: storiesLabel, icon: 'library-outline' as const },
    { value: 'conversations', label: conversationsLabel, icon: 'chatbubble-ellipses-outline' as const },
  ];

  return (
    <View
      style={[
        styles.tabsWrap,
        { backgroundColor: colors.background, paddingTop: pinned ? TABS_PAD_PINNED : TABS_PAD_FLOW },
      ]}
    >
      <SegmentedControl options={options} value={value} onChange={tab => onChange(tab as ProfileTab)} />
    </View>
  );
}

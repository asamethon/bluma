import type { ReactNode } from 'react';
import { View } from 'react-native';
import { profileStyles as styles } from '../styles/profileStyles';
import { ProfileStatCell } from './ProfileStatCell';

export type ProfileStat = { key: string; value: number; label: string; onPress?: () => void };

/**
 * İstatistik bandı. Kutu da yok, ayraç da yok: ayrım boşlukla kurulur.
 * Bloğun içindeki tek çizgi ilerleme şeridinin kendisidir — o da ayraç değil,
 * veridir. `children` bandın altına ilerleme künyesini alır.
 */
export function ProfileStatsBar({ stats, children }: { stats: ProfileStat[]; children?: ReactNode }) {
  return (
    <View style={styles.statsWrap}>
      <View style={styles.statsBar}>
        {stats.map(stat => (
          <ProfileStatCell key={stat.key} value={stat.value} label={stat.label} onPress={stat.onPress} />
        ))}
      </View>
      {children}
    </View>
  );
}

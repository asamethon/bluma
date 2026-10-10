import { BloomMark } from '@/components/ui';
import { walkthroughStyles as styles } from '@/features/auth/styles/walkthroughStyles';
import { View } from 'react-native';

/**
 * Karşılama zemininin tek dekoru: üstte ince marka kuralı ve çok soluk bir
 * amblem filigranı. Işık halesi/gradyan kullanılmaz.
 */
export function WalkthroughBackdrop() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <View style={styles.accentRule} />
      <View style={styles.watermark}>
        <BloomMark size={200} color="#fff" coreColor="#fff" />
      </View>
    </View>
  );
}

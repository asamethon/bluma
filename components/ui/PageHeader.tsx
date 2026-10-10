import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Layout, Spacing, useTheme } from '@/constants/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  topInset?: number;
  /** Başlık ile içeriği ayıran hairline; şeffaf/kaynaşan başlıklarda kapatılır. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Alt ekran başlığı. Editoryal dilde başlık sola hizalıdır (ortalanmış iOS
 * başlığı değil) ve yüzeyle aynı zeminde durur; ayrımı yalnızca hairline yapar.
 */
export function PageHeader({
  title,
  subtitle,
  onBack,
  right,
  topInset = 0,
  bordered = true,
  style,
}: Props) {
  const { colors, borders } = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: topInset + Spacing.sm,
          backgroundColor: colors.background,
          borderBottomWidth: bordered ? borders.hair : 0,
          borderBottomColor: colors.divider,
        },
        style,
      ]}
    >
      {onBack ? (
        <IconButton icon="arrow-back" iconSize={21} size={38} onPress={onBack} style={styles.back} />
      ) : null}

      <View style={styles.copy}>
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="textLight" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenX,
    paddingBottom: Spacing.md,
  },
  // İkon optik olarak metin bloğuyla hizalansın diye sola doğru çekilir.
  back: { marginLeft: -10 },
  copy: { flex: 1, minWidth: 0 },
  spacer: { width: 38, height: 38 },
});

import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Radius, Spacing, useTheme } from "@/constants/theme";
import { IconButton } from "./IconButton";
import { Text } from "./Text";
import { useSheetTransition } from "./useSheetTransition";

/** Sayfa kendi paletini dayatabilir (okuyucu sepya/siyah modu gibi). */
export type SheetPalette = {
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
};

/**
 * Alt sayfa (bottom sheet) primitifi. Editoryal dilde gölge yalnızca gerçekten
 * yüzen katmanlarda kullanılır — sheet bunlardan biridir.
 *
 * İçerik kaydırmayı ÇAĞIRAN kurar (FlatList ya da ScrollView); burada yalnızca
 * zemin, tutamak ve künye satırı vardır.
 */
export function Sheet({
  visible,
  onClose,
  onBackdropPress,
  onClosed,
  title,
  subtitle,
  palette,
  contentStyle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  /** Dış alana dokunmayı, paneli kapatmaktan ayrı ele almak isteyenler için. */
  onBackdropPress?: () => void;
  /**
   * Sayfa TAMAMEN kapandıktan sonra çalışır. Sistem ekranı (galeri, kamera,
   * paylaşım sayfası) açacak her akış bunu beklemek ZORUNDA: kapanmakta olan
   * bir modalın üstünde açılan sistem ekranı modalla birlikte yok edilir.
   */
  onClosed?: () => void;
  title?: string;
  subtitle?: string;
  palette?: SheetPalette;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const transition = useSheetTransition(visible, onClosed);
  const border = palette?.border ?? colors.border;

  if (!transition.mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Klavye açılınca sayfa yukarı kalkar; aksi halde arama alanı klavyenin
          altında kalıyordu. */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[styles.backdrop, { backgroundColor: colors.overlay }, transition.backdropStyle]}>
          <Pressable style={styles.fill} accessibilityLabel={title} onPress={onBackdropPress ?? onClose} />
        </Animated.View>
        <Animated.View
          onLayout={transition.onLayout}
          style={[
            styles.sheet,
            shadows.lg,
            {
              backgroundColor: palette?.surface ?? colors.surface,
              borderColor: border,
              // Güvenli alan kadar; üstüne fazladan boşluk eklenmez.
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
            transition.sheetStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: border }]} />
          {title ? (
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text variant="heading" color={palette?.text} numberOfLines={1}>{title}</Text>
                {subtitle ? (
                  <Text variant="caption" color={palette?.textSecondary} tone="textSecondary" numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <IconButton icon="close" size={36} iconSize={20} glass={false} color={palette?.textSecondary} onPress={onClose} />
            </View>
          ) : null}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  fill: { flex: 1 },
  sheet: {
    maxHeight: "86%",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  handle: { width: 36, height: 4, borderRadius: Radius.pill, alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingLeft: Spacing.screenX,
    paddingRight: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerText: { flex: 1, minWidth: 0 },
  content: { flexShrink: 1 },
});

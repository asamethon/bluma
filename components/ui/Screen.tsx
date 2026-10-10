import { View, useWindowDimensions, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, useTheme } from "@/constants/theme";

type Edge = "top" | "bottom";

export interface ScreenProps extends ViewProps {
  edges?: Edge[];
  maxContentWidth?: number;
  /** Ekran kenar boşluğunu tek yerden uygular (Spacing.screenX). */
  padded?: boolean;
}

/**
 * Ekran kabuğu: güvenli alan boşluklarını `edges`'e göre uygular.
 *
 * Bir kenarı ekranın KENDİSİ uyguluyorsa (ör. içeriğin durum çubuğunun altından
 * kayabilmesi için üst inset'i kendi başlık View'ine veren ekranlar) o kenarı
 * `edges`'ten çıkar; yoksa boşluk iki kez eklenir. Sekme ekranlarında alt boşluk
 * listelerin `contentContainerStyle`'ında durduğu için `edges={[]}` kullanılır.
 */
export function Screen({
  edges = ["top", "bottom"],
  maxContentWidth,
  padded = false,
  style,
  children,
  ...rest
}: ScreenProps) {
  const { colors } = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const capped = maxContentWidth != null && width > maxContentWidth;

  return (
    <View
      style={[
        { backgroundColor: colors.background },
        edges.includes("top") && { paddingTop: top },
        edges.includes("bottom") && { paddingBottom: bottom },
        padded && { paddingHorizontal: Spacing.screenX },
        style,
      ]}
      {...rest}
    >
      {capped ? (
        <View style={{ flex: 1, width: maxContentWidth, alignSelf: "center" }}>{children}</View>
      ) : (
        children
      )}
    </View>
  );
}

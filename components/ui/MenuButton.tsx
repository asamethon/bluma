import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/theme";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import { Ionicons } from "@expo/vector-icons";
import { Keyboard, Platform, View } from "react-native";
import { IconButton } from "./IconButton";

export type MenuItem = {
  id: string;
  label: string;
  /** iOS'ta SF Symbol adı. Android'de drawable aranır, bulunamazsa yalnızca metin çıkar. */
  symbol?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * İşletim sisteminin kendi açılır menüsünü açan ikon aksiyonu (iOS `UIMenu`,
 * Android `PopupMenu`). Menü butonun KENDİSİNE tutturulur; ekranın tepesinde
 * sabit duran taklit bir kart değildir.
 *
 * Görsel kabuk `IconButton`'dır (cam kapsül dahil); dokunmayı native buton
 * karşıladığı için ikon katmanı dokunuşa kapatılır.
 */
export function MenuButton({
  icon = "ellipsis-horizontal",
  items,
  size = 40,
  iconSize,
  color,
  title,
  accessibilityLabel,
  glass,
  glassColorScheme,
  dismissKeyboardOnOpen = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  items: MenuItem[];
  size?: number;
  iconSize?: number;
  color?: string;
  /** Menünün üstünde görünen başlık. */
  title?: string;
  accessibilityLabel?: string;
  /** Cam kapsül istenmediğinde (ör. kendi zemini olan bir kabuğun içinde). */
  glass?: boolean;
  glassColorScheme?: "light" | "dark";
  /** Menü açılırken önceki metin odağını ve yazılım klavyesini kapatır. */
  dismissKeyboardOnOpen?: boolean;
}) {
  const { scheme } = useTheme();
  // Menü kendi temasını izler; ikon rengi de oradan gelir. `imageColor` ZORUNLU:
  // native taraf onu her zaman okur ve verilmediğinde 0 (saydam) olur, ikon kaybolur.
  const palette = Colors[glassColorScheme ?? scheme];
  const dismissKeyboard = dismissKeyboardOnOpen
    ? () => {
        Keyboard.dismiss();
        requestAnimationFrame(() => Keyboard.dismiss());
      }
    : undefined;
  const actions: MenuAction[] = items.map(item => ({
    id: item.id,
    title: item.label,
    image: Platform.OS === "ios" ? item.symbol : undefined,
    imageColor: item.destructive ? palette.error : palette.text,
    attributes: { destructive: item.destructive, disabled: item.disabled },
  }));

  return (
    <View onTouchStart={dismissKeyboard}>
      <MenuView
        title={title}
        actions={actions}
        themeVariant={glassColorScheme ?? scheme}
        onOpenMenu={dismissKeyboard}
        onPressAction={({ nativeEvent }) => {
          items.find(item => item.id === nativeEvent.event)?.onPress();
        }}
      >
        <View pointerEvents="none" accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          <IconButton
            icon={icon}
            size={size}
            iconSize={iconSize}
            color={color}
            glass={glass}
            glassColorScheme={glassColorScheme}
          />
        </View>
      </MenuView>
    </View>
  );
}

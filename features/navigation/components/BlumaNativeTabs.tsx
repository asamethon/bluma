import { useTheme } from "@/constants/theme";
import { useNativeTabGate } from "@/features/navigation/hooks/useNativeTabGate";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

/**
 * iOS: ikon asset catalog'dan SENKRON okunur.
 *
 * `<Icon xcasset="..." />` prop'u işimizi görmüyor: expo-router onu
 * `{ uri: "WriteTab" }` image source'una çevirip yine RCTImageLoader'a veriyor
 * (boyut/ölçek bilgisi olmadan — düğmenin görünümü de bu yüzden değişiyordu).
 * `unstable_nativeProps.ios` ise doğrudan react-native-screens'e geçtiği için
 * gerçek `xcasset` tipini kullanabiliyoruz: `[UIImage imageNamed:]`, senkron,
 * 60pt, orijinal renkler, açık/koyu varyantı katalog çözüyor.
 *
 * `selectedIcon` de verilmeli: `role="search"` yüzünden seçili ikon boş
 * kalırsa iOS sistemin büyüteç simgesini koyar.
 */
const WRITE_TAB_NATIVE_PROPS = {
  ios: {
    icon: { type: "xcasset", name: "WriteTab" },
    selectedIcon: { type: "xcasset", name: "WriteTab" },
  },
} as const;

type WriteTabTriggerProps = {
  disabled: boolean;
  label: string;
};

function WriteTabTrigger({ disabled, label }: WriteTabTriggerProps) {
  return (
    <NativeTabs.Trigger
      name="write"
      role={Platform.OS === "ios" ? "search" : undefined}
      disabled={disabled}
      accessibilityLabel={label}
      unstable_nativeProps={WRITE_TAB_NATIVE_PROPS}
    >
      <NativeTabs.Trigger.Icon sf="square.and.pencil" md="edit_square" />
      <NativeTabs.Trigger.Label>{label}</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  );
}

/**
 * Sistem tab bar'ı iOS 26'da sürüklenebilir Liquid Glass indicator'ı sağlar.
 * `search` rolü, Yaz sekmesini sağdaki ayrık cam aksiyon olarak yerleştirir;
 * özel ikon sayesinde düğme arama değil yazma eylemi olarak görünür.
 *
 * iOS'ta ikon asset catalog'dan senkron okunur: `src` (require'lı PNG)
 * RCTImageLoader üzerinden ASENKRON yüklenir ve iOS 26 cam çubuğu ikon
 * sonradan gelince yuvaları yeniden ölçmediği için etiketler "Keş…" / "Küt…"
 * diye kırpılıp eski yerleşimin hayaletini bırakır (sekmeye basınca
 * düzelmesinin sebebi budur).
 */
export function BlumaNativeTabs() {
  const { colors, typography, alpha } = useTheme();
  const { t } = useTranslation();
  const { isWriteDisabled, screenListeners } = useNativeTabGate();
  const isAndroid = Platform.OS === "android";

  return (
    <NativeTabs
      tintColor={colors.primary}
      iconColor={{ default: colors.textSecondary, selected: colors.primary }}
      labelStyle={
        isAndroid
          ? {
              default: {
                color: colors.textSecondary,
                fontFamily: typography.labelSm.fontFamily,
                fontSize: 11,
              },
              selected: {
                color: colors.primary,
                fontFamily: typography.label.fontFamily,
                fontSize: 11,
              },
            }
          : undefined
      }
      backgroundColor={isAndroid ? colors.surface : undefined}
      indicatorColor={isAndroid ? colors.primarySoft : undefined}
      rippleColor={isAndroid ? alpha(colors.primary, 0.14) : undefined}
      labelVisibilityMode={isAndroid ? "labeled" : undefined}
      badgeBackgroundColor={colors.bloom}
      disableTransparentOnScrollEdge
      minimizeBehavior="never"
      screenListeners={screenListeners}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.home")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>{t("tabs.search")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {isAndroid ? (
        <WriteTabTrigger disabled={isWriteDisabled} label={t("tabs.write")} />
      ) : null}

      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark.fill" }}
          md={{ default: "bookmark", selected: "bookmarks" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.library")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person_outline", selected: "person" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.profile")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {isAndroid ? null : (
        <WriteTabTrigger disabled={isWriteDisabled} label={t("tabs.write")} />
      )}
    </NativeTabs>
  );
}

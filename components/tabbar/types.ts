import type { Ionicons } from "@expo/vector-icons";
import type { SFSymbol } from "expo-symbols";
import type { ComponentProps } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type TabDef = {
  name: string;
  title?: string;
  icon?: IoniconName;
  iconOutline?: IoniconName;
  /** iOS 26 cam çubuğunda kullanılan SF Symbol karşılıkları. */
  symbol?: SFSymbol;
  symbolOutline?: SFSymbol;
  /** Ortadaki "yaz" aksiyonu — normal sekme gibi çizilmez. */
  isCenter?: boolean;
  /** Sekme çubuğunda gösterilmeyen rotalar (ör. bildirimler). */
  hidden?: boolean;
};

/** Tek bir sekmenin çizime hazır hâli: tanım + durum + aksiyon. */
export type TabSlot = {
  tab: TabDef;
  focused: boolean;
  badge?: number;
  onPress: () => void;
};

export type TabBarViewProps = {
  slots: TabSlot[];
  /** Alt güvenli alan boşluğu (safe area). */
  bottomInset: number;
  /** Geniş ekranlarda çubuğun sabitleneceği genişlik; yoksa tam genişlik. */
  maxWidth?: number;
};

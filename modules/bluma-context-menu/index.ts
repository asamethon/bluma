import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type ContextMenuAction = {
  key: string;
  title: string;
  /** SF Symbol adı (ör. "trash"). */
  systemIcon?: string;
  destructive?: boolean;
};

export type BlumaContextMenuProps = {
  actions: ContextMenuAction[];
  /** Önizlemenin köşe yarıçapı; baloncukla aynı olmalı. */
  cornerRadius?: number;
  enabled?: boolean;
  onSelectAction?: (event: { nativeEvent: { key: string } }) => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Uzun basışta iOS'un kendi bağlam menüsünü açar ve SARDIĞI GÖRÜNÜMÜ kaldırıp
 * büyütür (WhatsApp'taki davranış). Yalnızca iOS; çağıran taraf Android için
 * kendi menüsünü kullanmalı.
 */
export const isContextMenuAvailable = requireOptionalNativeModule('BlumaContextMenu') != null;

/**
 * Native taraf derlemede yoksa `requireNativeView` sessizce çökmez; ekrana
 * "Unimplemented component: <ViewManagerAdapter_...>" kutusu basar. Çağıran
 * taraf `isContextMenuAvailable` ile kontrol edip kendi menüsüne düşmeli.
 */
export const BlumaContextMenu = isContextMenuAvailable
  ? requireNativeView<BlumaContextMenuProps>('BlumaContextMenu')
  : null;

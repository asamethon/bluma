import ExpoModulesCore

/// Menüde görünecek tek bir aksiyon.
struct ContextMenuActionRecord: Record {
  @Field var key: String = ""
  @Field var title: String = ""
  /// SF Symbol adı (ör. "trash"); yoksa ikonsuz çizilir.
  @Field var systemIcon: String? = nil
  @Field var destructive: Bool = false
}

/**
 Uzun basışta iOS'un kendi bağlam menüsünü açan görünüm.

 `@react-native-menu/menu` menüyü önizlemesiz kuruyor (`previewProvider: nil`),
 bu yüzden basılan görünüm kalkmıyordu. Burada `UITargetedPreview` veriliyor:
 iOS baloncuğun KENDİSİNİ kaldırıp büyütüyor, arkasını bulanıklaştırıyor.
 */
public class BlumaContextMenuModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BlumaContextMenu")

    View(BlumaContextMenuView.self) {
      Events("onSelectAction", "onMenuOpen", "onMenuClose")

      Prop("actions") { (view: BlumaContextMenuView, actions: [ContextMenuActionRecord]) in
        view.actions = actions
      }

      Prop("cornerRadius") { (view: BlumaContextMenuView, radius: Double) in
        view.previewCornerRadius = CGFloat(radius)
      }

      Prop("enabled") { (view: BlumaContextMenuView, enabled: Bool) in
        view.isMenuEnabled = enabled
      }
    }
  }
}

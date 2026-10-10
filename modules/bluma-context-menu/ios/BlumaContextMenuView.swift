import ExpoModulesCore
import UIKit

/**
 Çocuğunu (mesaj baloncuğunu) saran, uzun basışta `UIContextMenuInteraction`
 açan görünüm.

 Önizleme olarak GÖRÜNÜMÜN KENDİSİ verilir: iOS onu kaldırıp büyütür, orijinali
 o sırada gizler — yani ekranda kopya değil, mesajın aslı büyür. `UIPreviewParameters`
 ile zemin saydam ve köşeler baloncukla aynı yarıçapta tutulur; aksi halde iOS
 baloncuğun arkasına beyaz bir tabla koyuyor.
 */
public class BlumaContextMenuView: ExpoView, UIContextMenuInteractionDelegate {
  let onSelectAction = EventDispatcher()
  let onMenuOpen = EventDispatcher()
  let onMenuClose = EventDispatcher()

  var actions: [ContextMenuActionRecord] = []
  var previewCornerRadius: CGFloat = 16
  var isMenuEnabled = true

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    // Kendi zemini yok: baloncuk ne çiziyorsa o görünür.
    backgroundColor = .clear
    addInteraction(UIContextMenuInteraction(delegate: self))
  }

  private func targetedPreview() -> UITargetedPreview {
    let parameters = UIPreviewParameters()
    parameters.backgroundColor = .clear
    parameters.visiblePath = UIBezierPath(roundedRect: bounds, cornerRadius: previewCornerRadius)
    return UITargetedPreview(view: self, parameters: parameters)
  }

  public func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    configurationForMenuAtLocation location: CGPoint
  ) -> UIContextMenuConfiguration? {
    guard isMenuEnabled, !actions.isEmpty else { return nil }
    onMenuOpen()

    return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [weak self] _ in
      guard let self else { return nil }
      let items: [UIMenuElement] = self.actions.map { action in
        UIAction(
          title: action.title,
          image: action.systemIcon.flatMap { UIImage(systemName: $0) },
          attributes: action.destructive ? [.destructive] : []
        ) { [weak self] _ in
          self?.onSelectAction(["key": action.key])
        }
      }
      return UIMenu(title: "", children: items)
    }
  }

  public func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    previewForHighlightingMenuWithConfiguration configuration: UIContextMenuConfiguration
  ) -> UITargetedPreview? {
    targetedPreview()
  }

  public func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    previewForDismissingMenuWithConfiguration configuration: UIContextMenuConfiguration
  ) -> UITargetedPreview? {
    targetedPreview()
  }

  public func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willEndFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    onMenuClose()
  }
}

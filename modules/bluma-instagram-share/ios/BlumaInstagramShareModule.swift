import ExpoModulesCore
import Photos
import UIKit

/// Instagram Story paylaşımının girdileri.
struct InstagramStoryOptions: Record {
  @Field var imageUri: String = ""
  @Field var link: String = ""
  @Field var appId: String = ""
  @Field var topColor: String = "#2A1B52"
  @Field var bottomColor: String = "#7057D9"
}

/**
 Lansman görselini Instagram'a doğrudan açar.

 Story: `react-native-share` panoya yalnızca Instagram anahtarlarını yazdığı için
 kullanıcının kopyaladığı bağlantı siliniyordu. Burada AYNI pano öğesine düz metin
 olarak bağlantı da yazılır; kullanıcı Instagram'da "Bağlantı" etiketine
 yapıştırdığında bağlantı gelir.

 Gönderi: görsel Fotoğraflar'a kaydedilir, `instagram://library` o görsel seçili
 açılır. Pano değişmez, bağlantı kopyalı kalır.

 Instagram yüklü değilse `false` döner; JS tarafı sistem paylaşım sayfasına düşer.
 */
public class BlumaInstagramShareModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BlumaInstagramShare")

    AsyncFunction("shareToStory") { (options: InstagramStoryOptions, promise: Promise) in
      guard
        let scheme = URL(string: "instagram-stories://share?source_application=\(options.appId)"),
        UIApplication.shared.canOpenURL(scheme)
      else {
        promise.resolve(false)
        return
      }
      guard let fileURL = URL(string: options.imageUri), let image = try? Data(contentsOf: fileURL) else {
        promise.reject("E_IMAGE", "Lansman görseli okunamadı")
        return
      }

      var item: [String: Any] = [
        "com.instagram.sharedSticker.backgroundImage": image,
        "com.instagram.sharedSticker.backgroundTopColor": options.topColor,
        "com.instagram.sharedSticker.backgroundBottomColor": options.bottomColor,
      ]
      if !options.link.isEmpty {
        item["com.instagram.sharedSticker.contentURL"] = options.link
        item["public.utf8-plain-text"] = options.link
      }
      UIPasteboard.general.setItems(
        [item],
        options: [.expirationDate: Date().addingTimeInterval(60 * 5)]
      )
      UIApplication.shared.open(scheme, options: [:]) { opened in
        promise.resolve(opened)
      }
    }.runOnQueue(.main)

    AsyncFunction("shareToFeed") { (imageUri: String, promise: Promise) in
      guard let probe = URL(string: "instagram://app"), UIApplication.shared.canOpenURL(probe) else {
        promise.resolve(false)
        return
      }
      guard let fileURL = URL(string: imageUri), FileManager.default.fileExists(atPath: fileURL.path) else {
        promise.reject("E_IMAGE", "Lansman görseli bulunamadı")
        return
      }

      PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
        guard status == .authorized || status == .limited else {
          promise.reject("E_PHOTO_DENIED", "Fotoğraflara ekleme izni verilmedi")
          return
        }
        var assetId: String?
        PHPhotoLibrary.shared().performChanges({
          let request = PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: fileURL)
          assetId = request?.placeholderForCreatedAsset?.localIdentifier
        }) { success, _ in
          DispatchQueue.main.async {
            guard
              success,
              let id = assetId,
              let url = URL(string: "instagram://library?LocalIdentifier=\(id)")
            else {
              promise.reject("E_SAVE", "Görsel Fotoğraflar'a kaydedilemedi")
              return
            }
            UIApplication.shared.open(url, options: [:]) { opened in
              promise.resolve(opened)
            }
          }
        }
      }
    }.runOnQueue(.main)
  }
}

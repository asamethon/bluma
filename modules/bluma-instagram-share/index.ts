import { requireOptionalNativeModule } from 'expo';

export type InstagramStoryOptions = {
  /** `file://` ile başlayan yerel PNG yolu. */
  imageUri: string;
  /** Panoya düz metin olarak da yazılır; "Bağlantı" etiketine yapıştırılır. */
  link: string;
  /** Meta (Facebook) uygulama kimliği; Instagram Story akışı bunu ister. */
  appId: string;
  topColor?: string;
  bottomColor?: string;
};

type NativeInstagramShare = {
  shareToStory(options: InstagramStoryOptions): Promise<boolean>;
  shareToFeed(imageUri: string): Promise<boolean>;
};

/** Yalnızca iOS; native taraf derlemede yoksa null. */
const native = requireOptionalNativeModule<NativeInstagramShare>('BlumaInstagramShare');

/**
 * Görseli doğrudan Instagram Story düzenleyicisinde açar.
 * `false`: Instagram yüklü değil ya da modül derlemede yok; çağıran taraf sistem
 * paylaşım sayfasına düşmeli.
 */
export function shareToInstagramStory(options: InstagramStoryOptions): Promise<boolean> {
  return native ? native.shareToStory(options) : Promise.resolve(false);
}

/** Görseli Fotoğraflar'a kaydedip Instagram'ın gönderi akışında seçili açar. */
export function shareToInstagramFeed(imageUri: string): Promise<boolean> {
  return native ? native.shareToFeed(imageUri) : Promise.resolve(false);
}

// Uygulama genel yapılandırması.

// Bluma görsel servisi (bkz. server/README.md).
// Dolu ise görseller VPS'e yüklenir ve Firestore'da yalnızca URL saklanır.
// Boş string ise eski davranışa (sıkıştırılmış base64) düşülür — sunucu
// hazır olmadan hiçbir akış kırılmaz.
export const IMAGE_SERVER_URL = 'https://blumaimg.d4tecompany.com';

// Bluma push/hesap-silme servisi (bkz. server/push-worker/README.md).
// Dolu ise hesap silme buradaki /delete-account'a delege edilir (Admin SDK,
// reauthenticate gerektirmez, DM thread'lerini de siler). Boş string ise
// features/auth/services/userProfile.ts eski istemci-taraflı silme akışına
// düşer — sunucu hazır olmadan hesap silme tamamen kırılmaz.
export const API_SERVER_URL = 'https://bluma-api.d4tecompany.com';

// Yasal sayfalar (Google Sites) — uygulama içi WebView'da açılır (app/webview.tsx).
export const PRIVACY_POLICY_URL = 'https://sites.google.com/view/bluma-privacy-policy';
export const TERMS_URL = 'https://sites.google.com/view/bluma-terms-and-conditions';

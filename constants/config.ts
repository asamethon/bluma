// Uygulama genel yapılandırması.

// Bluma görsel servisi (bkz. server/README.md).
// Dolu ise görseller VPS'e yüklenir ve Firestore'da yalnızca URL saklanır.
// Boş string ise eski davranışa (sıkıştırılmış base64) düşülür — sunucu
// hazır olmadan hiçbir akış kırılmaz.
export const IMAGE_SERVER_URL = 'https://blumaimg.d4tecompany.com';

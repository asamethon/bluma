# E-posta şablonları

Doğrulama, adres değişikliği ve şifre sıfırlama postalarının tasarımları.

**Şablonların tek adresi: `server/push-worker/templates/`**

```
templates/tr/verify-email.html      Kayıt sonrası ve "Doğrula" düğmesinde
templates/tr/email-change.html      Adres değişikliği (bağlantı YENİ adrese gider)
templates/tr/password-reset.html    Şifre sıfırlama
templates/en/...                    Türkçe olmayan her kullanıcı için
templates/action.html               Bağlantıya tıklanınca açılan sayfa (iki dilli)
```

Daha önce burada birer kopya duruyordu; iki yerde tutmak er geç ayrışmaya yol
açacağı için kaldırıldı. Bu dosya yalnızca *neden* öyle yazıldıklarını
anlatır.

## Neden Firebase'in şablonunu kullanmıyoruz

Firebase Console'da şablon düzenleme bu proje için kilitli:

> Email template updates are currently unavailable for this project.

Aynı kilit "Customize action URL" ayarını da reddediyor. Deneme yapıldı,
sunucu her ikisini de reddetti — Console üzerinden çözülemiyor.

Ayrıca Firebase'in gönderen adresi `noreply@bluma-dc10e.firebaseapp.com`:
binlerce projenin paylaştığı, itibarı bizde olmayan bir alan adı. Gmail bu
postaları spam'e atıyordu.

## Mimari

Postayı Firebase'e hiç göndertmiyoruz. Admin SDK yalnızca **bağlantıyı**
üretiyor; tasarım, gönderen ve işlem sayfası bizde:

```
İstemci  →  POST /send-auth-email        (Bearer idToken; yalnızca kendi hesabına)
Worker   →  generateEmailVerificationLink()      bağlantıyı üretir
         →  bağlantıyı kendi işlem sayfamıza çevirir (ACTION_PAGE_URL)
         →  şablonu doldurup Resend ile gönderir   (kendi alan adımızdan)
Kullanıcı →  GET /auth/action            oobCode'u alır, işlemi tamamlar
```

İstemci sunucuya ulaşamazsa Firebase'in sade postasına düşer — posta hiç
gitmemesindense tasarımsız gitsin (`features/auth/services/authEmailApi.ts`).

Kurulum ve ortam değişkenleri: `server/push-worker/README.md`.

## Şablonlar neden bu biçimde yazıldı

E-posta istemcileri tarayıcı değildir:

- **Tablo düzeni + satır içi stil.** `<style>`, flexbox ve grid Outlook'ta
  çalışmaz.
- **Görsel yok.** Çoğu istemci uzak görselleri engeller; logo `<img>` olsaydı
  posta kırık görünürdü. Marka tipografiyle kuruluyor.
- **"Bulletproof" düğme** ve altında ham bağlantı yedeği.
- **Önizleme metni** en başta gizli `div` olarak.
- **Düz metin alternatifi** HTML'den otomatik türetiliyor (`mailer.js`);
  yalnızca-HTML postalar spam puanı alır.

Yer tutucular: `%LINK%`, `%DISPLAY_NAME%`, `%EMAIL%` ve adres değişikliğinde
`%NEW_EMAIL%`.

## Bilinen boşluk

"Şifremi unuttum" akışı bunun dışında: kullanıcı giriş yapmamış olduğu için
`/send-auth-email` kimlik doğrulayamıyor ve posta Firebase tarafından
gönderiliyor. Çalışır, ama sade ve İngilizce işlem sayfasına düşer.

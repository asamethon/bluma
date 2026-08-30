# E-posta şablonları

Firebase Authentication'ın gönderdiği üç e-postanın Türkçe, tasarlanmış
sürümleri. Firebase Console → **Authentication → Templates** altındaki
`Message` alanına yapıştırılır.

| Dosya | Console'daki şablon |
| --- | --- |
| `verify-email.html` | Email address verification |
| `email-change.html` | Email address change |
| `password-reset.html` | Password reset |

## Yapıştırma

1. Şablonu seç → kalem ikonu → `Message` alanının içeriğini dosyayla değiştir.
2. `Sender name` alanını **Bluma** yap (şu an `noreply` yazıyor — gelen kutusunda
   gönderen adı olarak bu görünüyor).
3. `Subject` alanları:
   - Doğrulama: `Bluma hesabını doğrula`
   - Adres değişikliği: `Bluma e-posta adresini onayla`
   - Şifre sıfırlama: `Bluma şifreni sıfırla`
4. Altta **Template language** = Türkçe. Her dil ayrı şablondur; İngilizce için
   de bir sürüm bırakmak istersen aynı HTML'i çevirip o dile ekle. İstemci
   `applyAuthLanguage()` ile kullanıcının dilini Firebase'e bildiriyor
   (`features/auth/services/emailVerification.ts`), yani doğru şablon seçilir.

## Neden bu biçimde yazıldı

E-posta istemcileri tarayıcı değildir; şablonlar buna göre kısıtlı tutuldu:

- **Tablo düzeni + satır içi stil.** `<style>` bloğu, flexbox ve grid birçok
  istemcide (özellikle Outlook) çalışmaz.
- **Görsel yok.** Çoğu istemci uzak görselleri varsayılan olarak engeller;
  logo bir `<img>` olsaydı e-posta kırık görünürdü. Marka, tipografiyle ve
  Bluma mor/pembe renkleriyle kuruluyor. Logo istersen VPS'teki görsel
  sunucusuna koyup `<img>` ekleyebiliriz, ama `alt` metni iyi olmalı.
- **"Bulletproof" düğme.** Arka plan rengi hem `bgcolor` niteliğinde hem
  `style` içinde; düğme render edilmezse bağlantı metni yedek olarak duruyor.
- **Önizleme metni** (preheader) en başta gizli `div` olarak — gelen kutusunda
  konu satırının yanında görünür.
- **Ham bağlantı da yazılı.** Düğmeyi tıklayamayan kullanıcı adresi
  kopyalayabiliyor.

Yer tutucular Firebase tarafından doldurulur: `%DISPLAY_NAME%`, `%LINK%`,
`%EMAIL%`, `%APP_NAME%` ve yalnızca adres değişikliği şablonunda `%NEW_EMAIL%`.

## Asıl profesyonellik sorunu: gönderen alan adı

Şu an e-postalar `noreply@bluma-dc10e.firebaseapp.com` adresinden çıkıyor.
Tasarımdan bağımsız olarak bu hem güvensiz görünüyor hem de spam'e düşme
ihtimalini artırıyor. Console'daki **Customize domain** ile kendi alan adına
geçilebilir (SPF/DKIM DNS kayıtları gerekir; alan adı zaten Cloudflare'da).

Daha ileri adım: doğrulama bağlantısını VPS'teki worker'da Admin SDK ile
üretip (`generateEmailVerificationLink`) postayı kendi SMTP/e-posta servisinle
göndermek. O zaman şablon tamamen senin kontrolünde olur ve Firebase'in
kısıtları kalkar. Şu anki ihtiyaç için gerekli değil.

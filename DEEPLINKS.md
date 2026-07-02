# Bluma — Paylaşım & Derin Bağlantılar (Deep Links)

Paylaşılan linkler `https://bluma-dc10e.web.app/user/<id>` (ve `/story/<id>`) biçimindedir
ve [Firebase Hosting](https://console.firebase.google.com/project/bluma-dc10e/hosting) üzerinden sunulur.

İki katman vardır:

1. **Universal / App Links (sorunsuz, onaysız)** — link doğrudan uygulamayı açar.
2. **`public/link.html` (yedek)** — uygulama yüklü değilse veya doğrulama tamamlanmamışsa
   `bluma://` şemasını deneyip, açılmazsa App Store / Play Store'a yönlendirir.

---

## iOS — Universal Links (kurulması gereken)

1. **Apple Team ID'yi gir.**
   - `public/.well-known/apple-app-site-association` dosyasında
     `TEAMID.com.asamethon.bluma` → `<SENIN_TEAM_ID>.com.asamethon.bluma`.
   - Team ID'yi [Apple Developer → Membership](https://developer.apple.com/account)
     veya App Store Connect'te bulabilirsin (10 karakter, örn. `ABCDE12345`).

2. **Hosting'i deploy et** (AASA dosyasını yayına almak için):
   ```bash
   firebase deploy --only hosting
   ```
   Doğrula:
   ```bash
   curl -s https://bluma-dc10e.web.app/.well-known/apple-app-site-association
   ```
   JSON dönmeli ve `Content-Type: application/json` olmalı (redirect olmamalı).

3. **Uygulamayı yeniden derleyip App Store'a gönder.**
   - `app.json` içine `ios.associatedDomains: ["applinks:bluma-dc10e.web.app"]` eklendi.
   - Bu entitlement **yüklü build'in içinde** olmak zorunda — mevcut canlı sürüm
     universal link'i yakalamaz. Yeni bir sürüm gerekir:
     ```bash
     eas build --profile production --platform ios
     # sonra App Store'a submit
     ```

4. **Test:** Notlar/Mesajlar'a `https://bluma-dc10e.web.app/user/<id>` yapıştırıp dokun →
   uygulama **onay ekranı olmadan** doğrudan profile açılmalı.

> Universal Links kurulana kadar `link.html` yedeği devrede kalır (tek dokunuşluk
> "Bluma'da aç?" onayıyla). İkisi birlikte sorunsuz çalışır.

---

## Android — App Links (opsiyonel, sonra)

1. **İmza parmak izini (SHA-256) gir.**
   - `public/.well-known/assetlinks.json` içindeki `REPLACE_WITH_SHA256_FINGERPRINT`
     yerine üretim imza sertifikanın SHA-256'sını koy.
   - Bulmak için: Play Console → *App integrity* → *App signing key certificate*,
     veya `eas credentials` (Android).

2. `app.json` → `android.intentFilters` ekle (parmak izi hazır olunca):
   ```json
   "intentFilters": [
     {
       "action": "VIEW",
       "autoVerify": true,
       "data": [
         { "scheme": "https", "host": "bluma-dc10e.web.app", "pathPrefix": "/user" },
         { "scheme": "https", "host": "bluma-dc10e.web.app", "pathPrefix": "/story" }
       ],
       "category": ["BROWSABLE", "DEFAULT"]
     }
   ]
   ```

3. `firebase deploy --only hosting` + yeni Android build.

> Parmak izi girilmeden Android tarafında `link.html` yedeği kullanılır (sorun olmaz).

---

## İlgili dosyalar
- `utils/deepLinks.ts` — paylaşım URL üreticileri (`WEB_BASE`)
- `public/link.html` — akıllı yönlendirme yedeği
- `public/index.html` — açılış sayfası
- `public/.well-known/apple-app-site-association` — iOS doğrulama (Team ID gerek)
- `public/.well-known/assetlinks.json` — Android doğrulama (SHA-256 gerek)
- `firebase.json` — hosting + headers + rewrites (`appAssociation: NONE`)
- `app.json` — `scheme: "bluma"`, `ios.associatedDomains`

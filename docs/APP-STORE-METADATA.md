# Bluma — App Store Metadata (Temmuz 2026)

> Sıfırdan yazılmış, kopyala-yapıştır hazır metinler. App Store Connect → uygulaman →
> **Distribution** sekmesindeki alanlara doğrudan girilir.
> "Wattpad" kelimesi YALNIZCA gizli **Keywords** alanında geçer — başlık/alt başlık/
> açıklamada marka adı olarak öne çıkarılmaz (Apple marka reddi riski).

---

## 1. Temel metinler

### Uygulama Adı — "App Name" (maks. 30 karakter)
```
Bluma: Hikâye Oku ve Yaz
```
*(24 karakter)*

### Alt Başlık — "Subtitle" (maks. 30 karakter)
```
Türkçe roman, fanfic ve öykü
```
*(28 karakter)*

### Anahtar Kelimeler — "Keywords" (maks. 100 karakter, virgülle ayır, ARAYA BOŞLUK KOYMA)
```
wattpad,webnovel,yazarlık,okuma,kitap,romantik,fantastik,fanfik,ücretsiz,topluluk,okur,bölüm,taslak
```
*(99 karakter. Başlık/alt başlıktaki kelimeleri [hikâye, oku, yaz, roman, fanfic, öykü, türkçe]
tekrarlamadım — Apple onları zaten otomatik indeksliyor, tekrar yer israfı.)*

### Tanıtım Metni — "Promotional Text" (maks. 170 karakter; istediğin zaman güncellersin, sıralamayı etkilemez)
```
Wattpad'in bıraktığı boşluğu dolduran Türkçe hikaye topluluğu. Binlerce ücretsiz roman, fanfic ve öykü oku; kendi hikâyeni yaz; kaldığın yerden devam et.
```
*(150 karakter)*

### Açıklama — "Description" (maks. 4000 karakter)
```
Bluma, okumayı ve yazmayı sevenler için tasarlanmış Türkçe bir hikaye topluluğu. Binlerce ücretsiz roman, fanfic ve kısa öyküyü keşfet; istersen kendi hikâyeni yaz, bölüm bölüm yayınla ve okurlarınla buluş.

NEDEN BLUMA?

📚 Ücretsiz ve sınırsız okuma
Romantik, fantastik, gizem, korku, bilim kurgu, gençlik, tarih ve daha fazlası. Binlerce hikaye tamamen ücretsiz — okuma limiti yok, ödeme duvarı yok.

✍️ Kendi hikâyeni yaz
Sessiz, dikkat dağıtmayan bir yazı stüdyosunda bölüm bölüm yaz. Taslak olarak sakla, hazır olunca tek dokunuşla yayınla. İlk okurun bir gün sonra değil, bugün gelsin.

🔖 Kaldığın yerden devam et
Okuma ilerlemen hesabına kaydedilir. Telefonunu değiştirsen bile bıraktığın satırdan devam edersin; kütüphanen hep yanında.

❤️ Gerçek bir okur-yazar topluluğu
Beğen, yorum yap, sevdiğin yazarları takip et. Yazarlar okurlarının tepkisini görür, okurlar sevdikleri hikayelerin bir parçası olur.

🎨 Göz yormayan okuma deneyimi
Açık, sepya, koyu ve OLED-siyah okuma temaları; yazı tipi ve satır aralığı tercihleri. Gece yarısı okuma seansları için tasarlandı.

🔒 Güvenli topluluk
Şikayet edilen içerik incelenir; olgun içerik açıkça işaretlenir ve yaş uygunluğuna göre filtrelenir.

Türkiye'de Türkçe okumak ve yazmak isteyen herkes için Bluma; ücretsiz, reklamsız ve topluluk odaklı. Bugün indir, okumaya ya da yazmaya hemen başla.
```

---

## 2. Yayın ayarları (App Store Connect panelindeki alanlar)

| Alan | Değer |
|---|---|
| **Birincil Kategori** | Kitaplar (Books) |
| **İkincil Kategori** | Sosyal Ağ (Social Networking) |
| **Yaş Derecesi** | **17+** (aşağıdaki anket cevaplarıyla) |
| **Fiyat** | Ücretsiz |
| **Telif Hakkı** | 2026 Bluma / D4TE Company |
| **Destek URL'si** | (zorunlu — aşağıya bak) |
| **Gizlilik Politikası URL'si** | (zorunlu — aşağıya bak) |
| **Pazarlama URL'si** | (isteğe bağlı) |

### Yaş Derecesi anketi (17+ için) — "Age Rating"
Kullanıcı üretimi içerik (UGC) barındırdığın ve olgun temalar olabildiği için 17+ hedefliyoruz.
Anket sorularında:
- **"Kısıtlanmamış Web Erişimi"** → Hayır
- **"Kullanıcı Üretimi İçerik / Sosyal özellikler"** → **Evet** (bu tek başına 17+ getirir ve moderasyon beyanı ister)
- **Cinsellik/Çıplaklık, Şiddet, Küfür, Olgun/Önerilmeyen Temalar** → içeriğinde 18+ etiketli hikayeler olduğundan bunları **"Sık/Yoğun"** yerine en az **"Seyrek/Hafif"** işaretle; en güvenlisi olgun temalar için "Sık/Yoğun" seçmek (düşük derece = ret riski).
- UGC seçilince Apple **moderasyon + şikayet + engelleme + kullanıcı engelleme** mekanizması ister → uygulamada rapor/şikayet akışın olduğunu beyan et.

### App Privacy — veri toplama beyanı ("App Privacy" bölümü)
| Veri türü | Toplanıyor | Kullanıcıya bağlı | Amaç |
|---|---|---|---|
| E-posta adresi | Evet | Evet | Uygulama işlevi (hesap/giriş) |
| Kullanıcı içeriği (hikaye, yorum — UGC) | Evet | Evet | Uygulama işlevi |
| Ad / kullanıcı adı | Evet | Evet | Uygulama işlevi (profil) |
| Kullanım verisi (Firebase Analytics) | Evet | Evet* | Analitik |
| Çökme/tanılama verisi (Sentry) | Evet | Hayır | Uygulama işlevi (hata teşhisi) |
| Konum | Hayır | — | — |
| Finansal bilgi | Hayır | — | — |
| Reklam / izleme | Hayır | — | (izleme yok → App Tracking Transparency gerekmez) |

\* Analytics'i kullanıcı kimliğine bağlamıyorsan "kullanıcıya bağlı değil" işaretle.

---

## 3. Ekran görüntüleri (Screenshots)
- **Zorunlu boyut:** 6.9" (iPhone 16 Pro Max, 1320×2868) — en az 1, en fazla 10 adet.
  Apple bu boyutu diğer iPhone boyutlarına otomatik ölçekler; ayrıca 6.5"/5.5" isteyebilir.
- **iPad** (supportsTablet: true olduğu için) 13" görselleri de gerekir.
- **İlk 3 görsel en kritik** (aramada önizlemede bunlar görünür):
  1. Okuyucu ekranı + kısa vaat metni: "Binlerce ücretsiz Türkçe hikaye"
  2. Keşfet/ana sayfa (Bloom tasarımını vitrine taşı) + "Reklamsız, sınırsız oku"
  3. Yazı stüdyosu + "Kendi hikâyeni yaz ve yayınla"
- Metin bindirmelerini Türkçe tut.
```
```

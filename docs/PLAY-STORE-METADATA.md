# Bluma — Google Play Store Metadata (Ağustos 2026)

> Sıfırdan yazıldı; **iOS metninin kopyası değil.** Sebep: App Store'da gizli bir
> Keywords alanı var ve açıklama metni indekslenmez. Play'de ise tam tersi —
> **gizli keyword alanı yoktur, sıralama uygulama adı + kısa açıklama + tam açıklama
> metninden çıkarılır.** Yani Play'de anahtar kelimeler görünür metnin İÇİNDE,
> doğal bir yoğunlukla geçmek zorunda.
>
> **Konumlama ilkesi:** Rakip marka adı (Wattpad vb.) hiçbir yerde GEÇMEZ. Play'de
> saklanacak yer yok ve Google'ın metadata politikası rakip marka adıyla arama
> kapmayı yasaklıyor — listing askıya alınır.

Kaynak alan: Play Console → **Kullanıcı sayısını artırın → Play Store'daki varlığı → Mağaza girişleri**

---

## 0. Hızlı ASO notları (bunları bilerek yazdım)

| Not | Neden |
|---|---|
| **"hikaye" — şapkasız** | Kullanıcılar aramada `â` yazmıyor. Görünür metinde şapkasız "hikaye" kullanıldı; sadece 1-2 yerde "hikâye" bırakıldı ki marka dili bozulmasın. Tutarlılık için tek biçimde ilerle. |
| **İlk 2-3 cümle en ağır basar** | Play algoritması açıklamanın başındaki kelimelere daha çok ağırlık veriyor. Bu yüzden "ücretsiz hikaye oku", "hikaye yaz", "roman", "fanfic" ilk paragrafta. |
| **Ölçülmüş yoğunluk** | Tam açıklamada (429 kelime): `hikaye*` %3.7 · `oku*` (oku/okur/okuma) %6.5 · `yaz*` (yaz/yazar/yazma) %5.1 · `roman` %0.9 · `ücretsiz` %0.9 · `fanfic` %0.5 · `kitap` %0.7. Türkçe eklemeli bir dil olduğu için aynı kök farklı kelimelere dağılıyor — stuffing değil, doğal varyasyon. |
| **Emoji** | Uygulama adında ve geliştirici adında **YASAK**. Kısa/tam açıklamada serbest ve tarama kolaylığı sağlıyor → başlıklarda birer tane kullanıldı. Play'de emoji **2 karakter** sayılır. |
| **Uzun kuyruk** | "ücretsiz hikaye okuma uygulaması", "kendi hikayeni yaz", "çevrimdışı kitap okuma" gibi düşük rekabetli ifadeler cümlelerin içine gömüldü. |

---

## 1. Uygulama adı — "Uygulama adı" (maks. 30 karakter)

**Kullan:**
```
Bluma: Hikaye Oku ve Yaz
```
*(24/30 karakter)*

Play'de sıralamaya en çok etki eden alan burasıdır. "hikaye", "oku", "yaz" üç ayrı
yüksek hacimli kelime ve "hikaye oku" / "hikaye yaz" tam eşleşmelerini yakalıyor.

**Alternatifler (test etmek istersen):**

| Metin | Krk | Kazanç / kayıp |
|---|---|---|
| `Bluma: Hikaye Oku ve Yaz` | 24 | ✅ Önerilen. Dengeli, hem okur hem yazar niyetini yakalar. |
| `Bluma: Hikaye ve Roman Oku` | 26 | "roman" kazanır, "yaz" kaybeder — yazar edinimi zaten %0, yaz'ı bırakma. |
| `Bluma: Hikaye, Roman, Fanfic` | 28 | En çok kelime, en az cümle. Dönüşümü düşürür (fiil yok, vaat yok). |

> ⚠️ **Şapka meselesi:** İlk gönderimde ad `Bluma: Hikâye Oku ve Yaz` (şapkalı â) olarak
> girildi. Türk kullanıcılar aramada `hikaye` yazıyor; Play'in Türkçe diakritik
> normalizasyonu belgelenmiş değil, yani `â` ile `a`'yı eşleştirmeme riski var ve bu
> risk sıfır kazanç karşılığında alınıyor. Şapkasız `Hikaye` ile yaz.
>
> Play'de ad değişikliğinde **sayı sınırı yok** (Apple'dan farklı), ama her değişiklik
> incelemeye girer — birkaç saatten birkaç güne. Yani düzeltmek serbest, sadece
> yayın öncesi tek turda halletmek daha temiz.

---

## 2. Kısa açıklama — "Kısa açıklama" (maks. 80 karakter)

**Kullan:**
```
Ücretsiz hikaye oku, roman ve fanfic keşfet, kendi hikayeni yaz ve yayınla.
```
*(74/80 karakter)*

Uygulama adından sonra en ağır indekslenen alan. Ayrıca Play Store'da ilk görünen
metin bu → hem keyword hem dönüşüm işi görüyor. "ücretsiz" bilinçli olarak öne alındı:
rakiplerin en çok şikayet edilen zaafı reklam/jeton (bkz. [RAKIP-ANALIZI.md](RAKIP-ANALIZI.md)).

**Alternatifler:**
```
Hikaye oku, roman ve fanfic keşfet, kendi hikayeni yaz. Reklamsız ve ücretsiz.
```
*(77/80 — "reklamsız" farkını öne çıkarır, "yayınla" kaybeder)*

```
Binlerce ücretsiz hikaye, roman ve fanfic oku; kendi hikayeni yaz ve yayınla.
```
*(76/80 — katalog büyüklüğü iması; katalog küçükken riskli, şimdilik kullanma)*

---

## 3. Tam açıklama — "Tam açıklama" (maks. 4000 karakter)

> Bu metin **indeksleniyor.** İçindeki her kelime arama sonucu getirebilir.
> Olduğu gibi kopyala-yapıştır.

```
Bluma, ücretsiz hikaye okumak ve kendi hikayeni yazmak isteyenler için tasarlanmış bir hikaye uygulaması. Roman, fanfic ve kısa öyküler arasından sana uygun olanı keşfet; istersen kendi hikayeni bölüm bölüm yaz, tek dokunuşla yayınla ve okurlarınla buluş.

Reklamsız. Jetonsuz. Tamamen ücretsiz.

📚 ÜCRETSİZ HİKAYE OKU
Romantik, fantastik, gizem, korku, bilim kurgu, gençlik, tarih ve şiir — her tür için hikaye burada. Başladığın romanı sonuna kadar oku. Bölüm başına ödeme yok, günlük okuma hakkı yok, sınır yok.

✍️ KENDİ HİKAYENİ YAZ
Dikkat dağıtmayan sade bir yazı stüdyosunda bölüm bölüm yaz. Taslak olarak sakla, hazır olduğunda yayınla. Onay sırasında günlerce beklemezsin; yayınla dediğin an hikayen okurların karşısında olur. İlk hikayeni yazmak için deneyimli bir yazar olman gerekmiyor.

🚫 REKLAM YOK, ÖDEME DUVARI YOK
En heyecanlı bölümde karşına çıkan "devamı için jeton al" ekranı yok. Okumanı bölen video reklamlar yok. Reklamsızlık için satılan bir abonelik de yok — çünkü zaten reklam yok. Sadece hikaye, sen ve okuma keyfi.

🔍 KEŞFETMESİ KOLAY
Türlere göz at, öne çıkan hikayeleri gör, yeni yazarlar keşfet. Aradığın hikayeyi başlığıyla, yazarıyla ya da türüyle bul. Sana uygun bir sonraki kitap her zaman bir adım ötede.

🔖 KALDIĞIN YERDEN DEVAM ET
Okuma ilerlemen hesabına kaydedilir. Telefonunu değiştirsen bile bıraktığın satırdan devam edersin; kütüphanen hep yanında.

📥 İNTERNETSİZ OKU
Sevdiğin hikayeleri tek dokunuşla indir, çevrimdışı kütüphanende sakla. Metroda, uçakta ya da internetin çekmediği her yerde okumaya kesintisiz devam et.

🌙 GÖZ YORMAYAN OKUMA DENEYİMİ
Açık, sepya, koyu ve OLED-siyah okuma temaları; yazı tipi ve satır aralığı tercihleri. Uzun okuma seansları ve gece yarısı okumaları için tasarlandı.

💬 YAZARLARLA VE OKURLARLA SOHBET ET
Sevdiğin bir hikayenin yazarına mesaj gönder, doğrudan sohbet et. Bluma'da okurlar ve yazarlar birbirine bir mesaj kadar yakın.

❤️ GERÇEK BİR OKUR-YAZAR TOPLULUĞU
Beğen, yorum yap, sevdiğin yazarları takip et. Yazarlar okurlarının tepkisini anında görür, okurlar sevdikleri kitapların bir parçası olur.

🎯 GÖREVLERLE İLERLE
Okuma ve yazma görevlerini tamamla, hedeflerine ulaş, alışkanlığını sürdür. İlerlemeni profilinde gör; her tamamlanan görev seni bir sonrakine götürür.

🛡️ GÜVENLİ TOPLULUK
Şikayet edilen içerik incelenir; olgun içerik açıkça işaretlenir ve yaş uygunluğuna göre filtrelenir. Rahatsız eden kullanıcıları engelleyebilir, uygunsuz içeriği tek dokunuşla bildirebilirsin.

BLUMA KİMLER İÇİN?
• Ücretsiz roman ve hikaye okumak isteyen okurlar
• Fanfic okumayı ve yazmayı sevenler
• İlk hikayesini yazmaya başlamak isteyen yeni yazarlar
• Okurlarına doğrudan ulaşmak isteyen yazarlar
• Reklamsız ve kesintisiz bir kitap okuma uygulaması arayan herkes

11 DİLDE KULLANILABİLİR
Türkçe, İngilizce, Almanca, İspanyolca, Portekizce (Portekiz ve Brezilya), Arapça, Endonezce, Japonca, Korece ve Çince.

Okumaya doymayanlar ve anlatacak bir hikayesi olanlar için Bluma seni bekliyor. Ücretsiz indir; ilk hikayeni bugün oku ya da bugün yaz.
```

*(≈2.750 karakter — limitin altında bilinçli olarak kaldı. Google'ın metadata politikası
"aşırı uzunluk, gereksiz detay ve tekrar" ihlal sayılabileceğini açıkça söylüyor;
4000'i doldurmak sıralama garantisi değil.)*

**Emoji istemiyorsan:** emoji satırlarını silip başlıkları sadece BÜYÜK HARF bırak.
Metnin geri kalanı aynen çalışır, indekslemede fark olmaz.

---

## 4. Mağaza ayarları (Console → Mağaza ayarları)

| Alan | Değer |
|---|---|
| **Uygulama veya oyun** | Uygulama |
| **Ücretli/ücretsiz** | Ücretsiz *(sonradan ücretliye çevrilemez)* |
| **Kategori** | **Kitaplar ve Referans** (Books & Reference) |
| **Etiketler (maks. 5)** | Kurgu · E-kitaplar · Okuma · Sosyal ağ · Topluluk *(Console'un sunduğu listeden en yakınları seç)* |
| **E-posta** | destek e-postan (zorunlu, herkese açık görünür) |
| **Telefon / web sitesi** | opsiyonel; web sitesi varsa gir (güven sinyali) |
| **Harici pazarlama** | Google'ın uygulamayı Play dışında tanıtmasına izin ver → **Evet** (ücretsiz erişim) |

**Kategori neden Sosyal değil?** Play'de tek birincil kategori var. "Kitaplar ve
Referans"ta rekabet daha düşük ve arama niyeti tam bizim kelimelerimizle örtüşüyor
(hikaye/roman/okuma). Sosyal kategorisi dev oyuncularla dolu — orada görünmezsin.

---

## 5. İçerik derecelendirmesi (IARC anketi)

Uygulama iOS'ta 16+ aldı; Play'de IARC anketi bölgeye göre derece üretir
(TR için genelde **12+/16+**, PEGI 12-16, ESRB Teen).

Anket cevapları:

| Soru | Cevap |
|---|---|
| Uygulama kategorisi | Referans, Haber veya Eğitim / **Sosyal ağ ve iletişim** |
| Şiddet | Hayır (kurgusal metin, görsel şiddet yok) |
| Cinsellik | **Evet — ima edilen/olgun temalar, açık içerik yok** |
| Küfür | **Evet — nadiren, hafif** |
| Uyuşturucu | Hayır |
| Kumar | Hayır |
| **Kullanıcılar birbiriyle etkileşime girebilir mi?** | **Evet** |
| **Kullanıcılar kişisel bilgi paylaşabilir mi?** | **Evet** (profil) |
| **Kullanıcı tarafından oluşturulan içerik paylaşılıyor mu?** | **Evet** |
| Konum paylaşımı | Hayır |
| Dijital satın alma | Hayır |

> ⚠️ UGC = "Evet" dediğin an Google **moderasyon sistemi, kullanıcı şikayet akışı ve
> engelleme özelliği** bekler. Üçü de uygulamada mevcut (rapor + engelleme akışı,
> reaktif moderasyon). İnceleme ekibine bunu yazılı olarak belirt.

---

## 6. Data safety (Veri güvenliği formu) — Console → Uygulama içeriği

Play bu formu App Privacy'den daha detaylı ister. Beyan:

| Veri türü | Toplanıyor | Paylaşılıyor | Zorunlu mu | Amaç |
|---|---|---|---|---|
| E-posta adresi | Evet | Hayır | Zorunlu | Hesap yönetimi |
| Ad / kullanıcı adı | Evet | Hayır | Zorunlu | Hesap yönetimi, uygulama işlevi |
| Fotoğraflar (profil/kapak) | Evet | Hayır | İsteğe bağlı | Uygulama işlevi |
| Kullanıcı içeriği (hikaye, yorum, mesaj) | Evet | Hayır | İsteğe bağlı | Uygulama işlevi |
| Uygulama etkileşimleri (Analytics) | Evet | Hayır | İsteğe bağlı | Analiz |
| Kilitlenme günlükleri / tanılama (Sentry) | Evet | Hayır | Zorunlu | Uygulama işlevi |
| Konum · Finans · Sağlık · Kişiler · SMS | Hayır | — | — | — |

Ek beyanlar:

- **Veriler aktarımda şifreleniyor mu?** Evet (HTTPS/TLS — Firebase + VPS görsel servisi)
- **Kullanıcı verisinin silinmesini isteyebilir mi?** **Evet** → uygulama içi hesap silme akışı var. Ayrıca Play, **hesap silme talebi için bir web URL'si** ister. Bu URL'yi hazırlaman gerekiyor (aşağıda ⚠️).
- **Reklam var mı?** Hayır → "Uygulamamda reklam yok" işaretle. *(Bu, Play Store'da "Reklam içermez" rozeti verir — rakiplere karşı görünür bir avantaj.)*
- **Bağımsız güvenlik incelemesi** → Hayır

---

## 7. Uygulama içeriği (App content) — diğer zorunlu beyanlar

| Bölüm | Cevap |
|---|---|
| **Gizlilik politikası** | URL zorunlu ⚠️ |
| **Reklamlar** | Uygulamamda reklam yok |
| **Uygulama erişimi** | ⚠️ **Tüm işlevler kısıtlı** → Google'a **test hesabı (e-posta + şifre)** ver, yoksa inceleme reddedilir |
| **İçerik derecelendirmesi** | Bölüm 5 |
| **Hedef kitle ve içerik** | Yaş grubu: **13-15, 16-17, 18+** *(13 altını SEÇME — Families politikası devreye girer)* |
| **Çocuklara yönelik mi?** | Hayır |
| **Haber uygulaması** | Hayır |
| **COVID-19 izleme** | Hayır |
| **Veri güvenliği** | Bölüm 6 |
| **Devlet uygulaması** | Hayır |
| **Finansal özellikler** | Hiçbiri |
| **Sağlık** | Hayır |

---

## 8. Grafik varlıklar

| Varlık | Spesifikasyon | Durum |
|---|---|---|
| **Uygulama simgesi** | 512 × 512 px, 32-bit PNG, saydamlık YOK, maks 1 MB | mevcut ikondan üretilebilir |
| **Öne çıkan grafik** (feature graphic) | **1024 × 500 px**, JPG veya 24-bit PNG, **saydamlık YOK**, zorunlu | ⚠️ üretilmeli |
| **Telefon ekran görüntüsü** | min 2, maks 8 · 1080 × 1920 px (9:16) önerilir · JPG/24-bit PNG · en-boy 16:9–9:16 arası | ⚠️ 4-6 adet üret |
| **7" tablet** | opsiyonel ama `supportsTablet: true` olduğu için önerilir | opsiyonel |
| **10" tablet** | opsiyonel | opsiyonel |
| **Tanıtım videosu** | YouTube URL, opsiyonel | sonraya |

**İlk 3 ekran görüntüsü kritik** (arama sonucunda önizlemede bunlar görünür):

1. Keşfet/ana sayfa + üstte metin: **"Binlerce hikaye, tamamen ücretsiz"**
2. Okuma ekranı (sepya veya koyu tema) + **"Reklamsız, jetonsuz, kesintisiz oku"**
3. Yazı stüdyosu + **"Kendi hikayeni yaz ve yayınla"**
4. Çevrimdışı kütüphane + **"İnternetsiz de oku"**
5. Mesajlaşma/profil + **"Yazarlarla doğrudan sohbet et"**

**Feature graphic brief'i:** 1024×500, sol tarafta Bluma logosu + tek cümle
("Hikayeni yaz, dünyanla paylaş"), sağda telefon mockup'ı. Metni **çok kısa tut** —
bu görsel Play'de küçük boyutta ve bazen üstünde oynat butonuyla görünüyor.
Kenarlardan ~%10 güvenli boşluk bırak (kırpılabiliyor).

---

## 9. ⚠️ Yayından önce eksikler (blocker listesi)

1. **Gizlilik politikası URL'si** — genel erişime açık, çalışan bir sayfa. iOS için varsa aynısı kullanılabilir.
2. **Hesap silme talebi URL'si** — Play'in ayrı ve zorunlu şartı. Uygulama içi silme akışı yeterli değil, web sayfası da gerekiyor.
3. **Test hesabı** — inceleme ekibine e-posta + şifre.
4. **Feature graphic (1024×500)** — bu olmadan listing yayınlanamaz.
5. **En az 2 (tercihen 4-6) telefon ekran görüntüsü.**
6. **Uygulama adını `Bluma` → `Bluma: Hikaye Oku ve Yaz`** yap. Ad 30 günde bir değişebilir.
7. **Kapalı test (closed testing)** — yeni geliştirici hesapları için Google 12 test kullanıcısıyla 14 günlük kapalı test şartı arıyor olabilir; Console'daki "Test edin ve yayınlayın" bölümünü kontrol et.

---

## 10. Sonraki adım: 11 dilde lokalize listing

Play **her dilin listing'ini ayrı indeksler.** Uygulama zaten 11 dile lokalize
(bkz. `i18n/locales/`), ama store metinleri yalnızca Türkçe olursa o pazarlarda
hiçbir aramada çıkmazsın — bu, elindeki en büyük ve en ucuz büyüme kaldıracı.

Hedef diller: `en-US`, `de-DE`, `es-ES`, `pt-PT`, `pt-BR`, `ar`, `in-ID`, `ja-JP`,
`ko-KR`, `zh-CN`.

> Lokalizasyon **çeviri değil, yeniden ASO'dur.** Her dilde o pazarın arama
> kelimeleri farklı (ör. EN: *story, novel, fanfiction, read books free* · ID:
> *cerita, novel, baca* · PT-BR: *histórias, romance, fanfic*). Metni birebir
> çevirmek keyword değerinin çoğunu yok eder.

Hazır olduğunda "11 dile geç" de — her dil için ayrı ad/kısa açıklama/tam açıklama
üreteyim (Endonezya ve Brezilya için `LANSMAN-ENDONEZYA.md` ve
`RAKIP-ANALIZI-BREZILYA.md` çalışmaları zaten var, onları temel alırım).

---

## Kaynaklar

- [Play Console — Mağaza girişi en iyi uygulamaları](https://support.google.com/googleplay/android-developer/answer/13393723?hl=en)
- [Play Console — Metadata politikası](https://support.google.com/googleplay/android-developer/answer/9898842?hl=en)
- [AppTweak — Play Store keyword research 2026](https://www.apptweak.com/en/aso-blog/play-store-keyword-research)
- [AppTweak — App store description best practices](https://www.apptweak.com/en/aso-blog/app-store-description-best-practices)
- [App Radar — Google Play screenshot sizes 2026](https://appradar.com/blog/android-app-screenshot-sizes-and-guidelines-for-google-play)

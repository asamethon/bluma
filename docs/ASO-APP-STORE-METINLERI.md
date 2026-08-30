# App Store Connect — kopyala/yapıştır metinleri

Hazırlanma tarihi: 15 Ağustos 2026. Kaynak: ASC denetimi (15 Tem–13 Ağu 2026 verisi).
Apple ID 6749180146 · Sürüm 2.0.1 · Tek dil (Turkish).

---

## Şimdi yapılabilir (uygulama incelemesi GEREKMEZ)

### Promotional Text
`Distribution → iOS App 2.0.1 → Promotional Text` · şu an **boş** · limit 170

```
Her hafta yeni bölümler, yeni yazarlar. Kaldığın yerden devam et ya da kendi hikâyeni yaz, bölüm bölüm yayınla. Ücretsiz, reklamsız, jetonsuz.
```
*142/170 karakter.* Açıklamanın en üstünde görünür, istediğin zaman değiştirebilirsin — kampanya/duyuru için sürekli kullan.

---

## Sonraki sürümle gider (yeni versiyon gönderimi gerekir)

### Name
`App Information → Name` · limit 30

```
Bluma: Hikaye Oku ve Yaz
```
*24/30.* **Tek değişiklik: `Hikâye` → `Hikaye` (şapka kalkıyor).* Türk kullanıcılar aramada şapkasız yazıyor; kendi ekran görüntülerinde de "Hikayeler" yazıyor. Apple'ın diakritik katlaması Türkçe `â` için garanti değil, bu riski taşımaya gerek yok.

### Subtitle
`App Information → Subtitle` · limit 30

```
Aşk, fanfic ve ücretsiz roman
```
*29/30.* Eskisi: `Türkçe roman, fanfic ve öykü`. `Türkçe` 6 karakter yiyordu ve kimse onu aramıyor. Yerine `aşk` geldi — bu kategoride açık ara en yüksek hacimli terim. `öykü` keyword alanına taşındı.

### Keywords
`Distribution → iOS App → Keywords` · limit 100

```
öykü,kitap,romantik,fantastik,fanfik,webnovel,yazarlık,edebiyat,genç,kurgu,şiir,macera,bölüm,gerilim
```
*100/100, tam dolu, virgülden sonra boşluk yok (boşluk karakter yer).*

**Neler çıktı ve neden:**

| Çıkan | Gerekçe |
|---|---|
| `wattpad` | Yüksek gösterim/sıfır tıklama üretiyor (kullanıcı Wattpad arar, Wattpad'e tıklar) **ve** marka ihlali riski. Play'de kullanmama kararını zaten vermiştin. |
| `ücretsiz` | Subtitle'a taşındı, tekrar etmeye gerek yok |
| `okuma`, `okur` | Başlıktaki `Oku` ile aynı kökten; Apple zaten indeksliyor |
| `romantik` kaldı, `topluluk`/`taslak` çıktı | Arama hacmi yok denecek kadar az |

**Kural:** Name ve Subtitle'daki kelimeleri keyword alanına TEKRAR YAZMA — Apple onları zaten indeksliyor, tekrar karakter israfı. Bu yüzden listede `bluma`, `hikaye`, `oku`, `yaz`, `aşk`, `fanfic`, `roman`, `ücretsiz` yok.

**Kararını isteyen tek kelime: `şiir`.** Uygulamada şiir içeriği yoksa çıkar — yanlış beklentiyle gelen kullanıcı hemen siler, bu da sıralamayı düşürür. Çıkarırsan yerine `vampir` (6) + 2 karakter boşluk kalır, ya da `okuma` (5) koy.

### What's New in This Version
Şu an `bug fix` yazıyor. Bu alan ürün sayfasında görünüyor ve "bakımsız uygulama" izlenimi veriyor.

```
Okuma akışını hızlandırdık, bölüm geçişleri artık daha akıcı. Birkaç hatayı da giderdik.

Önerilerini bekliyoruz — Ayarlar > Bize Ulaşın.
```

---

## Bunları değiştirme

- **Kategori (Books + Social Networking):** Browse gösterimin günde 1. Kategori seçimi şu an hiçbir şeyi etkilemiyor, uğraşma.
- **Lokalize listing'ler (11 dil):** İçerik Türkçe olduğu sürece erken. Yabancı kullanıcı boş kütüphaneye düşer, D1'de siler, sıralamanı aşağı çeker.

---

---

# Google Play — canlı listing düzeltmeleri

Denetim 15 Ağu 2026. Hesap **D4TE Company** (`/u/4/`), paket `com.d4tecompany.bluma`. Uygulama üretimde canlı.
Alan: Play Console → Kullanıcı sayısını artırın → Play Store'daki varlığı → Mağaza girişleri → Varsayılan mağaza girişi → Girişi düzenle

`docs/PLAY-STORE-METADATA.md`'deki öneriler **canlıya uygulanmamış**. Aşağıdakiler mevcut metinle farkı gösteriyor.

## Uygulama adı (maks. 30)

Canlı: `Bluma: Hikâye Oku ve Yaz` — şapkalı `â`

```
Bluma: Hikaye Oku ve Yaz
```
*24/30. Tek fark şapkanın kalkması. Play'de ad değişikliğinde sayı sınırı yok, ama her değişiklik incelemeye girer.*

## Kısa açıklama (maks. 80) — en kritik alan

Canlı: `Hikâyeni yaz, oku, paylaş. Yaratıcılığını Bluma'da özgürce keşfet.` (66/80)

Sorun: Play'de uygulama adından sonra **en ağır indekslenen alan** burası. Mevcut metinde `ücretsiz`, `roman`, `fanfic`, `öykü` kelimelerinin hiçbiri yok; 38 karakter arama değeri olmayan slogana gidiyor ve 14 karakter boşta duruyor.

```
Ücretsiz hikaye oku, roman ve fanfic keşfet, kendi hikayeni yaz ve yayınla.
```
*75/80. Önerilen.*

Alternatifler:

| Metin | Krk | Fark |
|---|---|---|
| `Ücretsiz hikaye, roman ve fanfic oku; kendi hikayeni yaz. Reklamsız, jetonsuz.` | 78 | Rakiplerin en çok şikâyet edilen zaafını (jeton/reklam) öne çıkarır, `yayınla` kaybeder |
| `Aşk romanı, fanfic ve öykü oku; kendi hikayeni yaz. Ücretsiz ve reklamsız.` | 74 | `aşk` en yüksek hacimli terim; `hikaye` kelimesini kaybeder (ama adda zaten var) |

## Diğer

- **Tam açıklama:** 3039/4000 — 961 karakter boşta. Uzun kuyruk ifadeler için yer var.
- **Video yok.** Play'de tanıtım videosu dönüşümü ölçülebilir şekilde artırıyor; App Store'a göre burada etkisi daha büyük.
- **7/8 ekran görüntüsü.** Bir slot boş.
- **Lokalizasyon yok** (yalnızca tr-TR). iOS'taki gerekçe burada da geçerli: içerik Türkçeyken erken.

## A/B testi — şimdilik hayır

Play'in iOS'ta olmayan bedava bir özelliği var: mağaza girişi denemeleri (A/B testi). Ama 28 günde **24 ziyaretçi** var; hiçbir deneme istatistiksel anlamlılığa ulaşmaz. Trafik birkaç bin ziyaretçiye çıkana kadar bu düğmeye dokunma.

## Beklenti

Dönüşüm oranın (indirme/gösterim) %1,91 — Books kategorisinde 25. persentilin altı. Medyan %4,53.
Bu metinler tek başına medyana taşımaz; `wattpad`'i çıkarmak **gösterimi düşürüp dönüşümü yükseltir** (kaybettiğin gösterim zaten tıklamaya dönüşmüyordu). Asıl sıçrama puan sayısının 1'den çıkmasıyla gelir.

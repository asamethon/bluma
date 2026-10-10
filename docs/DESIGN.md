# Bluma — Story-first Tasarım Dili

Renk paleti korunur (`constants/Colors.ts`), form dili değişir. Tek cümlelik
kural: **hikâye yüzeylerinde kapak başroldedir; derinlik gölgeyle değil, katman
ve çizgiyle kurulur.**

## İlkeler

1. **Gölge yok.** Kartlar, butonlar, satırlar düzdür. Gölge yalnızca gerçekten
   *yüzen* katmanlarda kullanılır: modal, alt sayfa, okuyucu ayar paneli.
   `shadows.sm` bilinçli olarak boştur (geriye dönük uyumluluk için duruyor).
2. **Ayrım hairline'dır — ama yalnızca listelerde.** Liste satırları
   kutulanmaz; `Divider` ile ayrılır. Grup başlıkları sade künye olarak kalır
   (`SettingsGroup`, `SectionHeader`). Tek bir nesneyi anlatan künye/detay
   bloklarında (hikâye önizleme gibi) çizgi KULLANILMAZ: ritmi boşluk kurar,
   ölçüler orta noktayla ayrılan tek tipografik satırda toplanır
   (`3 bölüm · 8dk · 1,2b okunma`).
3. **Renk anlam taşır.** Dekoratif gradyan, blob, ışık halesi yoktur. Renk;
   tür kimliği, durum ya da aksiyon demektir. Tonlu zeminler `alpha()` ile
   tek yerden üretilir.
4. **Kapak kitap gibi davranır.** Ortak `StoryCover`; 2:3 oran, ince sırt,
   bölüm sayacı ve tamamlanma/premium mühürlerini tek yerde üretir.
5. **Serif = editoryal, sans = arayüz.** Spectral yalnızca başlık/okuma
   alanlarında; Hanken Grotesk tüm arayüz metinlerinde.
6. **Hareket sessizdir.** Yaylanma yok; basış geri bildirimi ölçek değil
   opaklıktır (`Motion.pressOpacity`).

## Ölçek

| Token | Nerede |
|---|---|
| `Radius.xs 6` | rozet, küçük ikon karesi, ilerleme şeridi |
| `Radius.sm 8` | chip, ikon kutusu, medya küçük görsel |
| `Radius.md 12` | buton, input, kart, ikon aksiyonu |
| `Radius.lg 16` | büyük kart, öne çıkan medya |
| `Radius.xl 20` | alt sayfa (sheet) üst köşeleri |
| `Radius.pill` | **yalnızca** avatar, sayaç baloncuğu, anahtar (switch) |

`Spacing.screenX 20` kenar boşluğu, `Spacing.section 34` bölüm arası ritim.
Tipografi rollerinde `lineHeight / fontSize >= 1.3` — Türkçe aksanlı harfler
daha dar satırlarda tepeden kırpılıyor.

## Kit haritası

`components/ui/`: Text, Button, IconButton, Chip, Badge/CountBadge, Avatar,
Switch, TextField, Divider/LabeledDivider, ListRow, SettingsGroup, Callout,
EmptyState, Skeleton, SegmentedControl (varsayılan: alt çizgili sekme),
Sheet, ProgressBar, Stepper, SectionHeader, PageHeader, Screen, StoryCover,
StoryRow, StoryCardSpine/Feature.

`Sheet` tüm alt sayfaların tek zeminidir (tutamak, künye satırı, kapatma,
güvenli alan, açılış hareketi); içerik kaydırmasını çağıran kurar. Modal'ın
kendi `slide` animasyonu KULLANILMAZ: o, karartıyı da sayfayla birlikte yukarı
sürükler. Karartı ekranın tamamında yerinde belirir (opaklık), sayfa altından
yükselir — ikisi ayrı animasyonlardır (`useSheetTransition`). `Stepper` 44pt dokunma
hedefli eksi/artı üçlüsüdür. Uygulama teması dışında bir palette oturan
bileşenler (okuyucu) renklerini prop olarak alır: `Sheet.palette`,
`SegmentedControl.palette`, `Skeleton.color`.

## Hikâye kartı kiti

- `StoryCover`: kapak görseli, fallback, kitap sırtı, bölüm sayacı ve durum
  mühürlerinin tek kaynağıdır.
- `StoryCardSpine`: yatay raflarda kullanılan portre kitap kartıdır. Kapak,
  tür, serif hikâye başlığı ve yazar künyesi taşır.
- `StoryRow`: dikey akışlardaki yatay hikâye kartıdır. Blog özeti göstermez;
  büyük kapak, yazar, okuma süresi, görüntülenme ve okuma durumu gösterir.
- `StoryCardFeature`: editör seçkisi gibi vitrin alanlarında aynı kapak ve meta
  dilinin geniş varyantıdır.

Kartlarda başlık için `storyTitle` tipografi rolü kullanılır. Kapak oranı,
rozetler veya meta ikonları feature bileşenlerinde yeniden üretilmez.

## Okuyucu

Okuma ekranı uygulamanın en uzun süre bakılan yüzeyidir; kuralları biraz daha
katıdır:

1. **Metin yerinden oynamaz.** Çubuklar metnin ÜSTÜNDE yüzer, üst boşluk
   sabittir. Aşağı okurken çubuklar çekilir, yukarı dönüşte geri gelir.
2. **İlerleme her zaman görünür.** Ekranın alt kenarındaki 2px'lik ray
   çubuklardan bağımsızdır.
3. **Gezinme tek yerde toplanır.** Bölümler arası geçiş üst çubuktaki künyeden
   açılan içindekiler sayfası, bölüm sonundaki adlandırılmış kartlar ve alt
   çubuktaki birincil aksiyondur — metnin içine ok gömülmez.
4. **Künye bir kez.** Hikâye başlığı/yazar yalnızca ilk bölümde; sonraki
   bölümler kendi açılış künyesiyle başlar.
5. **Ayarlar örnekle gösterilir.** Punto, tema, yazı tipi ve satır aralığı
   seçimleri ayar sayfasındaki canlı örnek metne anında yansır; okuma paleti
   sheet'in kendi zeminidir.

Yeni ekran yazarken: kutu çizmeden önce `SettingsGroup + ListRow + Divider`
üçlüsünün işi görüp görmediğine bak. Görüyorsa kart yapma.

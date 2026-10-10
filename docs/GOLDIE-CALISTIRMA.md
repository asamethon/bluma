# Goldie ile magaza gorselleri: calistirma kilavuzu

5 Eylul 2026. Goldie 0.3.1.

Bu repoda hazir olanlar:

```
.argent/flows/store-00-login.yaml        Kurulum: cihazi bir kez hesaba sokar
.argent/flows/store-01-discover.yaml     Kesfet ana akisi
.argent/flows/store-02-reader.yaml       Okuma ekrani
.argent/flows/store-03-write.yaml        Yazi studyosu
.argent/flows/store-04-search.yaml       Ara ve turler
.argent/flows/store-05-story.yaml        Hikaye detay
.argent/flows/store-preview-0*.yaml      Onizleme videosunun 4 parcasi
goldie/goldie.config.ts                  Sahneler, metinler, Bluma paleti
scripts/goldie-build.sh                  Release build + goldie/build/ kopyasi
.argent/secrets.env                      Demo hesap bilgileri (gitignore'lu)
```

Su an yalnizca **tr** uretiliyor. goldie ham kareleri BIR kez alip simulatoru
`locales[0]`'a sabitliyor (`out/raw` altinda dil klasoru yok), `frame` ise ayni
kareye her dilin metnini basiyor. Yani `en-US` eklemek Ingilizce baslik +
Turkce arayuz demek olurdu. Ingilizce set icin Ingilizce secicili akis
kopyalari ve ayri bir capture turu gerekiyor. `goldie.config.ts` icindeki
`en-US` metinleri o gun icin duruyor.

Basliklar ve alt basliklar `docs/BLUMA-3.0.0-MAGAZA-METINLERI.md` ile ayni
konumlandirmadan geliyor: ucretsiz / reklamsiz / jetonsuz, ve okuma ile yazmanin
bir arada olmasi.

---

## Bunu neden Claude (Cowork) calistiramiyor

Goldie'nin iOS tarafi macOS ve iOS simulatoru istiyor. Cowork'un bu bilgisayardaki
kabugu izole bir **Linux** sanal makinesi: `xcrun` ve `simctl` yok, Xcode
DerivedData gorunmuyor. Bulut tarafi da Linux. Yani `goldie capture` buradan
calismaz.

Calistirmasi gereken yer: **kendi Mac'inde, bu reponun icinde, yerel Claude Code**.

```
/plugin marketplace add kacperkapusciak/goldie
/plugin install goldie@goldie
```

sonra:

```
goldie ile App Store gorsellerini uret, goldie/goldie.config.ts zaten hazir
```

Yerel ajan config'i ve akislari bulup dogrudan "mevcut kuruluma devam" moduna
girer, sifirdan baslamaz.

---

## Once yapilacaklar

**1. Demo hesabini `.argent/secrets.env` dosyasina yaz.** Sifre akis
dosyalarina YAZILMAZ; akislar `{{secret:...}}` yer tutucusu kullaniyor ve
argent degeri bu dosyadan okuyor. Dosya `.gitignore`'da.

```bash
cat > .argent/secrets.env <<'EOF'
BLUMA_DEMO_EMAIL=...
BLUMA_DEMO_PASSWORD=...
EOF

argent secrets     # sadece isimleri yazar, degeri asla
```

Neden giris sart: misafir modunda **Yaz sekmesi kapali**
(`useNativeTabGate` misafiri giris sheet'ine yolluyor) ve okuyucu birkac
paragraf sonra "Gerisi seni bekliyor" duvarina cikiyor.

**2. Cihazi bir kez hesaba sok.** Sahne akislari giris YAPMAZ, giris ayri bir
kurulum akisinda:

```bash
argent flow run store-00-login --device <udid>
```

Bunun ayri durmasinin sebebi: Firebase oturumu iOS **Keychain**'de tutuluyor
ve uygulama kaldirilinca silinmiyor. goldie her capture oncesi `reinstall-app`
yapiyor, bu app verisini temizliyor ama oturumu temizlemiyor. Giris blogu
akislarin icindeyken yalnizca ILK akista calisiyordu; kalan sekizi walkthrough
yerine ana ekranla acilip `Hesap Oluştur` bulamadigi icin patliyordu.

Tekrar kosmak gerekir: cihaz yeniyse, `xcrun simctl keychain <udid> reset`
yapildiysa ya da simulator silindiyse. Kontrol: uygulamayi ac, ana ekran
geliyorsa gerek yok.

**3. Demo hesabin icerigi dolu olsun.** En az bir yayinlanmis hikaye, bir
taslak ve **en az bir okumaya devam edilen hikaye**. Sonuncusu sart:
`store-02-reader` ana ekrandaki "Okumaya Devam Et" rafinin ilk kartina
dokunuyor.

**4. Release build al.** Debug build Metro ister ve karelere LogBox bandi
basar.

```bash
./scripts/goldie-build.sh
```

Bu script build alip `.app`'i `goldie/build/` altina kopyalar, `appPath` de
oraya bakar. **DerivedData'ya dogrudan bakmayin:** macOS disk baskisi altinda
orayi purgeable cache sayip siliyor. 6 Eylul 2026'da capture'in ortasinda
sildi; akislar `FBSApplicationLibrary returned nil` ile patladi ve uygulama
cokuyormus gibi gorundu. Disk %90'in uzerindeyse once yer acin.

**5. ffmpeg ve Node 20+.**

```bash
brew install ffmpeg
node -v
```

---

## Calistirma

```bash
cd /Users/sametbalci/Desktop/fantasy/bluma_LATEST
export GOLDIE_CONFIG=$PWD/goldie/goldie.config.ts

npx -y goldie@0 doctor

# ONEMLI: capture oncesi simulatoru kapatin
xcrun simctl shutdown <udid>

npx -y goldie@0 capture
npx -y goldie@0 frame
npx -y goldie@0 manifest
npx -y goldie@0 studio --no-open   # http://localhost:4321
npx -y goldie@0 preview            # video, dakikalar surer
npx -y goldie@0 verify
```

**Simulatoru neden kapatiyoruz:** goldie'nin `prepare()` fonksiyonu simulator
zaten aciksa ve dil sabitliyse yeniden baslatmayi atliyor - ama argent'in
native devtools enstrumantasyonunu kuran `restartServer()` cagrisi tam o
atlanan dalda. Acik simulatorde capture `could not connect to native devtools`
ile patliyor ve tool-server'i yeniden baslatmak duzeltmiyor. Kapali
simulatorde goldie kendi boot yolundan gecip enstrumantasyonu kuruyor.

---

## Cozulen sorunlar (6 Eylul 2026)

Akislar uygulama calistirilmadan, kaynak koddan okunan etiketlerle yazilmisti.
Ilk capture'da su varsayimlar yanlis cikti:

| Varsayim | Gercek |
|---|---|
| Sifre alaninin placeholder'i `auth.passwordPlaceholder` ("En az 6 karakter") | `SignInScreen.tsx` icinde sabit `"••••••••"`. O i18n anahtari KAYIT ekraninin. |
| Ana ekranda "Bu Hafta Öne Çıkanlar" rafi gorunur | Ust raflar "Okumaya Devam Et" ve "Editörün Seçimi". `home.weeklyHighlights` kodda var ama feed'in asagisinda; `await visible` sadece ekrandakini gorur. |
| "Okumaya Başla" okuyucuyu acar | Acmaz - sayfayi bolum listesine kaydirir. Okuyucuyu acan, listenin altindaki "Baştan Oku". Ya da ana ekrandaki devam karti, ki o tek dokunusla dogrudan okuyucuya girer. |
| Okuyucudan geri donmek icin kenar kaydirmasi yeter | Iki seviye var (okuyucu -> detay -> feed) ve detayda jest belirsiz. Detay sayfasi kaydirilmisken gezinme cubugu bolgesine dokunmak once BASA KAYDIRIYOR, geri gitmiyor; ancak sayfa en ustteyken geri calisiyor. |
| Kart koordinatlari sabit | Degil. Demo hesabi okudukca "Okumaya Devam Et" rafi buyuyor ve altindaki her sey kayiyor ("Editörün Seçimi" 0.700'den 0.877'ye indi). Ustteki rafi hedefleyin. |
| `theme.fontFamily` sistem yigini olabilir | Olamaz. Render motoru cozemeyip Turkce glifi olmayan yedege dusuyor, basliklarda `ş ı ğ` yerine tofu kutusu ciziyordu. Paketli fontlardan tam Turkce kapsami olanlar: **DM Sans, Montserrat, Merriweather, DM Mono**. **Lato ve Noto Sans SC'de yok.** |
| Ilk onizleme segmenti `launch:` ile baslar | Baslamamali. goldie ilk segmentin kaydindan once zaten `restart-app` yapiyor; akista ayrica launch olunca splash animasyonu klibin icine giriyor ve segment 12.1 sn'ye cikiyordu (toplam 37.5 sn, Apple tavani 30). Launch'siz 7.4 sn, toplam 27.2 sn. |

**Kalici cozum halen ayni:** uygulamada sifir `testID` var, o yuzden kart ve
geri dugmesi secimleri koordinata dayaniyor. Her koordinatin ustunde ne
oldugunu ve nereden olculdugunu anlatan bir `echo` var; UI degisince once
onlari okuyun.


## Google Play

Ayni sahneler ve ayni akislar Android'de de calisiyor. Gereken:

1. Release **APK** (repodaki `.aab` ise yaramaz):
   `cd android && ./gradlew :app:assembleRelease`
2. Pixel 10 Pro ya da Pixel 9 Pro donanim profilli bir AVD baslat.
3. `goldie/goldie.config.ts` icindeki `android` blogunun yorumunu kaldir,
   `devices` dizisine `"pixel-10-pro"` ekle.
4. Ayni `capture` / `frame` komutlari.

Play video yuklemesi kabul etmiyor, YouTube linki istiyor. Goldie dikey videoyu
uretir, YouTube'a sen koyarsin.

---

## Ciktilar

| Ne | Nereye |
|---|---|
| 6.9" ekran goruntuleri | `goldie/out/screenshots/iphone-6.9/<dil>/` |
| Onizleme videosu | `goldie/out/previews/iphone-6.9/<dil>/` |
| Play ekran goruntuleri | `goldie/out/screenshots/pixel-10-pro/<dil>/` |

`goldie/out/` ve `goldie/goldie.design.json` `.gitignore`'a eklendi.
`goldie.config.ts` ve akislar commit edilecek.

---

## Neden simdi degistiriyoruz

App Store'daki mevcut 7 kare **2.x arayuzunu** gosteriyor. 3.0.0 yeni sekme
cubugu ve yeniden tasarlanmis yazi studyosuyla cikiyor; eski arayuzun
goruntuleriyle yayinlamak tutarsizlik yaratir.

Ayrica su an **0 tane App Preview videosu** var (3 hakkin var). Onizleme videosu
urun sayfasi donusumunu artiran ve elinde hic olmayan tek kaldirac.

---

## Yerel Claude Code'a yapistirilacak prompt

Mac'te terminal:

```bash
cd /Users/sametbalci/Desktop/fantasy/bluma_LATEST
claude
```

Claude Code kurulu degilse: `npm i -g @anthropic-ai/claude-code`

Sonra sirayla:

```
/plugin marketplace add kacperkapusciak/goldie
```
```
/plugin install goldie@goldie
```

Ardindan asagidaki blogu oldugu gibi yapistir.

---

Bu repoda goldie kurulumu zaten hazir. Sifirdan baslama, mevcut kuruluma devam et.

Once sunlari oku:
- goldie/goldie.config.ts
- docs/GOLDIE-CALISTIRMA.md
- .argent/flows/store-*.yaml

Hedef: sadece App Store (iOS). Google Play'i simdilik atla.

Bunlari tekrar kesfetme, hazir bilgi:
- Uygulamada hic testID yok. Seciciler gorunur metne dayaniyor, hikaye
  kartlarinda normalize koordinat kullanildi. Bunlar ilk capture'da
  kirilabilir. Kirilirsa argent MCP ile describe edip duzelt ve YAML'daki
  echo satirlarini da gercege uydur.
- Misafir modu pazarlama karesi icin kullanilamaz: useNativeTabGate misafiri
  Yaz sekmesinde giris sheet'ine yolluyor, okuyucu da "Gerisi seni bekliyor"
  duvarina cikiyor. Bu yuzden her akis demo hesabiyla giris yapiyor.
- Demo hesap bilgileri .argent/secrets.env icinde, akislar {{secret:...}}
  kullaniyor. Sifre akis dosyalarinda YOK.
- Release build sart. Debug build karelere LogBox bandi basiyor.

Sirayla yap:
1. Release simulator build al, appPath'i gercek DerivedData yoluyla guncelle.
2. doctor'in isaretledigi her seyi temizle.
3. capture, frame, manifest. Kirilan akisi tamir et, tekrar dene.
4. studio'yu ac ve bana linki ver.
5. Onizleme videosunu arka planda render et. Toplam 15-30 saniye disina
   cikarsa segment temposunu ayarla, metni degistirme.
6. verify calistir, sonucu raporla.

goldie/goldie.config.ts icindeki headline, subhead ve store metinlerini
DEGISTIRME. Onlar ASO planindan geliyor ve karakter limitleri dogrulandi.
Sadece teknik ve gorsel sorunlari coz. Metin degistirmen gerektigini
dusunuyorsan once bana sor.

---

## Sonrasinda kullanilacak kisa promptlar

Studio acildiktan sonra gorsel ayar:

```
serit ritmini degistir: theme.template'i ["hero","classic","classic","tilt","minimal"] yap, frame ve manifest calistir
```
```
arka plan cok soluk, moru koyulastir ve tekrar frame'le
```
```
ikinci kare zayif, okuma ekraninda ayarlar sheet'i acik olsun. store-02-reader akisini guncelle ve o kareyi yeniden capture et
```

Video sure hatasi:

```
onizleme 15 saniyenin altinda kaldi, segmentlerdeki wait ve holdSeconds degerlerini artir ve preview'i tekrar calistir
```

Play sirasi geldiginde:

```
simdi Google Play kareleri: android blogunun yorumunu kaldir, devices'a pixel-10-pro ekle, release APK al ve Pixel 10 Pro AVD'de ayni sahneleri capture et
```

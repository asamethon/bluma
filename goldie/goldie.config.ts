// Tip icin: `npm i -D goldie` yaptiktan sonra su satiri ac.
// import type { GoldieConfig } from "goldie/dist/config";

/**
 * Bluma 3.0.0 magaza gorselleri.
 *
 * Calistirmadan once bak: docs/GOLDIE-CALISTIRMA.md
 * Metinlerin kaynagi: docs/BLUMA-3.0.0-MAGAZA-METINLERI.md
 *
 * Akislar .argent/flows altinda. Her biri demo hesabiyla giris yapar;
 * misafir modunda Yaz sekmesi kapali ve okuyucu "Gerisi seni bekliyor"
 * duvarina takiliyor, o yuzden pazarlama karesi icin giris sart.
 */

const APP_ROOT = "/Users/sametbalci/Desktop/fantasy/bluma_LATEST";

const config = {
  appRoot: APP_ROOT,

  // Release simulator build. Debug build Metro ister ve karelere LogBox
  // bandi basar.
  // DerivedData'ya DOGRUDAN bakma: macOS disk baskisi altinda orayi
  // purgeable cache sayip siliyor (6 Eylul 2026'da capture ortasinda sildi).
  // Build sonrasi .app buraya kopyalaniyor: scripts/goldie-build.sh
  appPath: `${APP_ROOT}/goldie/build/bluma.app`,
  bundleId: "com.asamethon.bluma",

  // Play kareleri icin: emulator baslat, release APK ver ve devices'a
  // "pixel-10-pro" ekle. Repodaki .aab ise yaramaz, APK gerekiyor.
  // android: {
  //   appPath: `${APP_ROOT}/android/app/build/outputs/apk/release/app-release.apk`,
  //   applicationId: "com.d4tecompany.bluma",
  // },

  devices: ["iphone-6.9"],
  // Sadece tr. goldie ham kareleri BIR kez alip simulatoru locales[0]'a
  // sabitliyor (out/raw altinda dil klasoru yok), frame ise ayni kareye her
  // dilin metnini basiyor. Yani en-US eklemek Ingilizce baslik + Turkce
  // arayuz demek olurdu. Ingilizce set isteyince: Ingilizce secicili akis
  // kopyalari + ayri bir capture turu gerekiyor.
  locales: ["tr"],
  appearance: "light",

  // Mor arka plana gumus daha temiz oturuyor; mavi kasa markayla carpisiyor.
  frame: { variant: "17-pro-silver" },

  theme: {
    // Bluma paleti: primarySoft #EEEAFB -> background #F8F7FC -> beyaz.
    background: "linear-gradient(160deg, #EEEAFB 0%, #F8F7FC 55%, #FFFFFF 100%)",
    headlineColor: "#211D2C",
    subheadColor: "#686171",
    // DIKKAT: burasi render motoruna verilen CSS font yigini. Onceki deger
    // goldie'nin SYSTEM_FONT'uydu; node tarafinda cozulemedigi icin Turkce
    // glifi olmayan bir yedege dusuyor ve basliklarda s/i/g yerine tofu
    // kutusu ciziyordu ("Basladigin" -> "Ba[]lad[][][]n").
    // Paketli fontlardan tam Turkce kapsami olanlar: DM Sans, Montserrat,
    // Merriweather, DM Mono. Lato ve Noto Sans SC'de s/S/I/g/G YOK.
    fontFamily: '"DM Sans", system-ui, sans-serif',
    copyHeightRatio: 0.24,
    deviceWidthRatio: 0.84,
    layout: "classic",
    // Serit ritmi. Once "classic" ile bak, sonra studioda dene:
    // template: ["hero", "classic", "classic", "tilt", "minimal"],
    // ya da hazir olanlar: "editorial" | "showcase" | "magazine" | "storyboard" | "dynamic"
  },

  store: {
    name: "Bluma",
    subtitle: {
      tr: "Ücretsiz aşk romanı, fanfic",
      "en-US": "Free romance, fanfic, novels",
    },
    developer: "D4TE Company",
    category: "Books",
    rating: 4.8,
    ratingCount: "8 Ratings",
    ageRating: "13+",
    price: "Free",
    description: {
      tr: "Ücretsiz. Reklamsız. Jetonsuz. Bluma'da bir hikâyeye başladıysan sonuna kadar okursun. Kilit yok, bekleme yok.\n\nAşk romanları, fanfic, fantastik kurgu, korku ve gizem. İstersen sen de kendi hikâyeni yaz, bölüm bölüm yayınla.",
      "en-US": "Free. No ads. No coins. On Bluma, if you start a story you finish it. No locked chapters, no waiting.\n\nRomance, fanfic, fantasy, horror and mystery. And if you have a story of your own, write it here and publish it chapter by chapter.",
    },
  },

  scenes: [
    // Ilk uc kare kurulum sayfasinda gorunuyor. Sirasi: bolluk, okuma, yazma.
    {
      kind: "screenshot",
      id: "discover",
      flow: "store-01-discover",
      headline: {
        tr: "Binlerce hikâye, hepsi ücretsiz",
        "en-US": "Thousands of stories, all free",
      },
      subhead: {
        tr: "Reklam yok, jeton yok, bölüm kilidi yok.",
        "en-US": "No ads, no coins, no locked chapters.",
      },
    },
    {
      kind: "screenshot",
      id: "reader",
      flow: "store-02-reader",
      headline: {
        tr: "Başladığın hikâyeyi sonuna kadar oku",
        "en-US": "Start a story, finish it",
      },
      // Eski metin ("Yazı tipi, satır aralığı ve tema senin") okuma ayarlari
      // sheet'ini vaat ediyordu ama kare onu gostermiyor. Karede gercekten
      // gorunen: kesintisiz bolum metni ve altta "Sonraki Bölüm".
      subhead: {
        tr: "Bölüm biter, sonrakine tek dokunuş.",
        "en-US": "One chapter ends, the next is one tap.",
      },
    },
    {
      kind: "screenshot",
      id: "write",
      flow: "store-03-write",
      headline: {
        tr: "Kendi hikâyeni yaz ve yayınla",
        "en-US": "Write your own story",
      },
      subhead: {
        tr: "Bölüm bölüm yaz, tek dokunuşla yayınla.",
        "en-US": "Write chapter by chapter, publish with one tap.",
      },
    },
    {
      kind: "screenshot",
      id: "search",
      flow: "store-04-search",
      headline: {
        tr: "Aradığın türü bul",
        "en-US": "Find your genre",
      },
      subhead: {
        tr: "Romantik, fantastik, gizem, korku ve daha fazlası.",
        "en-US": "Romance, fantasy, mystery, horror and more.",
      },
    },
    // 5. sahne 6 Eylul 2026'da cikarildi: 4 kareyle devam ediyoruz.
    //
    // Neden: hikaye detay karesinde "8 okunma · 1 begeni" magazada zayif
    // duruyordu. Alternatif olarak yazar profili denendi (baslik da ekranla
    // daha iyi ortusuyordu) ama profil ekrani HİKÂYE / TAKİPÇİ / TAKİP
    // sayilarini buyuk puntoyla yan yana basiyor ve taranan yazarlarin
    // hepsi 1/1/1 (miss_malfoy 0/0/0) cikti. Sayilar dipnottan ekranin
    // kahramani haline geldigi icin takas kaybettiriyordu.
    //
    // Metinler ASO planindan geliyor, ileride kullanilmak uzere duruyor.
    // Akis dosyasi da silinmedi: .argent/flows/store-05-story.yaml
    // Geri acmak icin: asagiyi yorumdan cikar, capture + frame + manifest.
    //
    // {
    //   kind: "screenshot",
    //   id: "story",
    //   flow: "store-05-story",
    //   headline: {
    //     tr: "Yazarını takip et, ilk sen oku",
    //     "en-US": "Follow your writers",
    //   },
    //   subhead: {
    //     tr: "Yeni bölüm yayınlandığında haberin olsun.",
    //     "en-US": "Be first to read the next chapter.",
    //   },
    // },

    // Onizleme videosu. Toplam 15-30 saniye arasinda kalmali.
    {
      kind: "preview",
      id: "preview",
      // holdSeconds kisildi: ilk render 37.5 sn cikti, Apple 15-30 istiyor.
      // Asil kazanc store-preview-01-open'dan launch adimini cikarmakti
      // (splash klibe giriyordu); bunlar geri kalan payi kapatiyor.
      segments: [
        { id: "open", flow: "store-preview-01-open" },
        { id: "pick", flow: "store-preview-02-pick", holdSeconds: 0.3 },
        { id: "read", flow: "store-preview-03-read", holdSeconds: 0.3 },
        { id: "write", flow: "store-preview-04-write", holdSeconds: 1.0 },
      ],
    },
  ],
};

export default config;

# Bluma — Eylem Planı (Temmuz 2026)

> **Bağlam:** Wattpad Temmuz 2024'ten beri Türkiye'de erişime engelli ve App Store TR'den kaldırılmış durumda; boşluğu Vaveyla/KitapPad/HooBook doldurmaya çalışıyor ama kazanan yok. Bu pencere kapanmadan (Wattpad geri döner ya da Vaveyla konsolide olur) hızlı hareket etmek gerekiyor. Strateji: **para yatırma, önümüzdeki 4-6 haftayı yatır.**
>
> Sıralama mantığı: önce kullanıcı geldiğinde skandal olacak şeyler (güvenlik), sonra kullanıcının gelmesini sağlayacak şeyler (mağaza + ASO), sonra kullanıcıyı tutacak şeyler (ürün), en son para.

---

## FAZ 0 — Güvenlik ve veri bütünlüğü (yayın engelleyici)

Bunlar yeni sürüm gönderilmeden ÖNCE bitmeli. Her kural değişikliğinden sonra: `firebase deploy --only firestore:rules`

### 0.1 Taslakların herkese açık olmasını kapat 🔴 KRİTİK
- **Sorun:** `firestore.rules:90` — `stories` için `allow read: if true`, `isPublished` şartı yok. Herkes herkesin yayımlanmamış taslağını tam içeriğiyle okuyabilir.
- **Yapılacak:** Read kuralını böl: `allow read: if resource.data.isPublished == true || (isSignedIn() && resource.data.authorId == request.auth.uid);`
- **Dikkat:** Liste sorguları kural ile filtre uyumu ister — `loadUserStories` (taslaklar dahil) sadece sahibi çağırdığı için `where('authorId','==',uid)` sorgusu geçer; ama `isPublished` filtresi olmayan başka sorgu varsa kırılır. Değişiklik sonrası tüm ekranları elden geçir (ana sayfa, keşfet, arama, profil, taslaklar).
- **Kabul:** Başka bir hesapla (veya REST ile) taslak dokümanı okumaya çalışınca `permission-denied`.

### 0.2 Sayaçların keyfi yazılmasını engelle 🔴 KRİTİK
- **Sorun:** `firestore.rules:93-96` — `onlyChanges(['likesCount','commentsCount','viewsCount'])` alanı kısıtlıyor, değeri kısıtlamıyor. Herhangi bir kullanıcı herhangi bir hikâyenin sayaçlarını istediği değere set edebilir. `users.followersCount` için de aynı (`firestore.rules:30`).
- **Yapılacak:** Diff kontrolü ekle — her sayaç için değişim yalnızca ±1 olabilir:
  ```
  function bumpBy(field, n) {
    return request.resource.data[field] == resource.data.get(field, 0) + n;
  }
  // update kuralında: onlyChanges([...]) && (bumpBy('likesCount',1) || bumpBy('likesCount',-1) || ...)
  ```
  Aynı deseni `users.followersCount`, `conversations` sayaçları ve yorumlardaki `likesCount` için uygula.
- **Kabul:** `updateDoc(storyRef, { viewsCount: 999999 })` reddedilir; `increment(1)` geçer.

### 0.3 Push token ve bildirim spam açığını kapat 🔴 KRİTİK
- **Sorun 1:** `firestore.rules:180` — `userPushTokens` herhangi bir oturumlu kullanıcıya okunur: tüm kullanıcı tabanının token'ları toplanıp Expo push API'siyle spam/phishing yapılabilir.
- **Sorun 2:** `firestore.rules:165` — `notifications` create herkese açık: herkes herkese sahte bildirim yazabilir.
- **Yapılacak (kısa vade, mimariyi bozmadan):**
  - `notifications` create'e içerik kısıtı ekle: `request.resource.data.type` beyaz listede olsun, `senderId == request.auth.uid` zorunlu olsun, alan seti sabitlensin (`hasOnly`).
  - `userPushTokens` okuma açığı client-side push mimarisinin doğası — kısa vadede kabul edilen risk olarak dokümante et.
- **Yapılacak (kalıcı, FAZ 3):** Push gönderimini Cloud Function'a taşı (`notifications` onCreate tetikleyicisi token'ı okur, Expo'ya gönderir). Token okuma kuralı `if false` olur, bildirim sahteciliği biter.
- **Kabul:** Farklı bir kullanıcının token dokümanını okuma girişimi kısa vadede en azından loglanıyor; kalıcı çözümde reddediliyor.

### 0.4 Hesap silme akışını düzelt 🔴 KRİTİK (App Store reddi riski)
- **Dosya:** `features/auth/services/userProfile.ts:139-208`
- **Sorunlar:**
  1. Google/Apple girişli kullanıcıda re-authenticate yok → oturum eskiyse `deleteUser` `auth/requires-recent-login` ile patlar, kullanıcı hesabını **silemez**. Apple'ın hesap silme zorunluluğuna aykırı.
  2. Hikâye dokümanları alt koleksiyonlar silinmeden siliniyor → likes/views/comments yetim kalıyor ve kurallar gereği (isStoryAuthor lookup'ı) bir daha silinemiyor. Doğru sıra `deleteStory`'de zaten var — onu çağır.
  3. Silinmeyen veriler: `likedStories`, `savedStories`, `readingLists`, `notifications` (kullanıcıya ait olanlar), `userPushTokens/{uid}`, `notificationSettings/{uid}`, DM thread'leri, başkalarının hikâyelerindeki yorumları. KVKK/GDPR eksiği.
  4. `readingProgress_*` AsyncStorage anahtarları temizlenmiyor (bkz. 2.1).
- **Yapılacak:**
  - Apple için `AppleAuthentication.refreshAsync` + `reauthenticateWithCredential`, Google için `GoogleSignin.signInSilently` + credential ile reauth ekle; `requires-recent-login` hatasında kullanıcıya "çıkış yapıp tekrar girin" yönlendirmesi göster.
  - Hikâye silmede mevcut `deleteStory(storyId)` fonksiyonunu kullan (alt koleksiyon sırası doğru).
  - Yukarıdaki koleksiyonların temizliğini ekle. (Kalıcı çözüm: FAZ 3'te tek Cloud Function.)
- **Kabul:** Google hesabıyla girip 1 hafta bekletilen (veya token'ı eskitilmiş) hesap silinebiliyor; silinen kullanıcının Firestore'da dokümanı kalmıyor.

### 0.5 Firestore görüntülenme mimarisini ucuzlat 🟡
- **Dosya:** `features/story/services/views.ts:18-70`
- **Sorun:** Her okumada `views` alt koleksiyonu sorgulanıyor (okuma başına ekstra maliyet); 3-görüntülenme limiti sadece istemcide; misafirler hiç sayılmıyor.
- **Yapılacak:** Deterministik doküman ID'sine geç: `views/{userId}` içinde `count` alanı tut, `count < 3` ise `increment(1)`. Sorgu yerine tek doküman okuması. Kurala `views/{userId}` yaz: `request.auth.uid == userId` + count artışı ±1.
- **Kabul:** Okuma başına 1 doc read + koşullu 2 write; sorgu yok.

---

## FAZ 1 — Mağaza ve dağıtım (fırsat penceresi, ~1 hafta, FAZ 0 ile paralel başlanabilir)

### 1.1 Yeni sürümü App Store'a gönder 🔴
- Mevcut mağaza sürümü çok eski. FAZ 0 bittiği an EAS build + submit.
- İçerik derecelendirmesini **17+ / sık-yoğun olgun temalar** olarak işaretle (18+ içerik barındırıyorsun; Wattpad'in kapanma gerekçesi bu — mağaza derecesi savunma hattın).
- App Privacy bölümünü gerçek veri toplamaya göre doldur (Analytics, e-posta, UGC).

### 1.2 Play Store'a çık 🔴 EN YÜKSEK ETKİ
- TR'de Android payı ~%75+. `android/` klasörü ve `google-services.json` hazır görünüyor; eksik olan: imzalama anahtarı (upload key), Play Console hesabı ($25 tek seferlik), Data Safety formu, içerik derecelendirme anketi (yine olgun içerik beyanıyla).
- Kapalı test (Play'in 12-test-kullanıcısı şartı yeni hesaplarda geçerli olabilir — kontrol et; gerekiyorsa arkadaş çevresiyle 14 günlük kapalı test başlat, süre burada kritik olduğu için HEMEN başla).
- **Kabul:** Uygulama her iki mağazada güncel sürümle yayında.

### 1.3 ASO — "wattpad" boşluğunu doldur 🔴 BEDAVA VE DEĞERLİ
- **App Store:** anahtar kelime alanına (100 karakter): `wattpad,hikaye,hikaye oku,kitap yaz,roman oku,fanfic,interaktif hikaye,okuma uygulaması` benzeri. "Wattpad" kelimesini **başlıkta/alt başlıkta KULLANMA** (marka reddi), keyword alanında kullanmak yaygın ve kabul görür.
- **Play Store:** uzun açıklamaya doğal cümleler içinde "Wattpad alternatifi arayanlar için Türkçe hikâye okuma ve yazma uygulaması" tarzı geçişler (Play açıklama metnini indeksler).
- Başlık önerisi: `Bluma: Hikâye Oku & Yaz` — alt başlık: `Türkçe hikâye, roman ve kitap topluluğu`.
- Ekran görüntülerini yenile: ilk 3 görsel okuyucu deneyimi + "ücretsiz & Türkçe" mesajı. (Bloom tasarım sistemi zaten güçlü, bunu vitrine taşı.)
- **Kabul:** Her iki mağazada yeni metadata yayında; App Store'da "wattpad" aramasında Bluma ilk sayfada görünmeye başlıyor (2-4 hafta izle).

### 1.4 Ucuz SEO — arama trafiğini avla 🟡
- Tek sayfalık landing (bluma sitesi ya da VPS'e statik sayfa — VPS zaten var) + 2-3 blog yazısı:
  - "Wattpad açıldı mı? (Güncel durum + alternatif)"
  - "Wattpad alternatifi en iyi Türkçe hikâye uygulamaları"
  - "Hikâyeni Wattpad'den nasıl taşırsın?"
- Rakiplerin (Vaveyla, yayinliyor.com) büyüme motoru görünür biçimde bu. Kopyalaması bedava.
- Sayfalardan mağaza linkleri + Universal Link/App Link (DEEPLINKS.md zaten var).
- **Kabul:** Sayfalar Google'da indekslendi; Search Console kurulu.

### 1.5 Rakip analizi 🟡 (yarım gün)
- Vaveyla, KitapPad, HooBook'u kullanıcı olarak dene. Mağaza yorumlarındaki 1-2 yıldızlı şikâyetleri topla (kategori kategori not al: performans mı, moderasyon mu, zorla üyelik mi, reklam mı?).
- Konumlanmayı onların en çok şikâyet edilen zayıflığına kur.
- **Çıktı:** `docs/RAKIP-ANALIZI.md` — her rakip için: güçlü yön, zayıf yön, bizim cevabımız.

---

## FAZ 2 — Ürün: tutundurma ve fonksiyonel buglar

### 2.1 Okuma ilerlemesini hesaba bağla 🔴 (retention'ın temeli)
- **Sorun:** İlerleme AsyncStorage'da (`app/story/[id].tsx:113`), kullanıcıya değil cihaza bağlı; hesap değişince sızıyor, cihaz değişince kayboluyor; sadece bölüm indeksi tutuluyor.
- **Yapılacak:**
  - Firestore'a taşı: `users/{uid}/readingProgress/{storyId}` → `{ chapterIndex, scrollRatio, updatedAt }`. Kural: owner-only. AsyncStorage'ı çevrimdışı cache olarak tut (offline-first: önce yerel yaz, arkada senkron).
  - Anahtarları `readingProgress_{uid}_{storyId}` yap ve logout'ta temizle (kısa vadeli yama; Firestore'a geçince gereksizleşir).
  - Bölüm içi scroll konumunu da kaydet (ScrollView `onScroll` throttle + oran olarak).
  - "Okumaya devam et" rafını feed'deki 50 hikâyeyle sınırlamaktan çıkar (`app/(tabs)/index.tsx:179`) — progress kaydındaki storyId ile `getStoryById` çek.
- **Kabul:** Aynı hesapla ikinci cihazda kaldığın satırdan devam; hesap değişince raf temiz.

### 2.2 Bölüm-bazlı veri modeline geçiş 🔴 (1MB bombası + maliyet)
- **Sorun:** Tüm hikâye tek dokümanda `content` alanında (`\n§§\n` ayraçlı). 1MB limitinde uzun hikâye kaydedilemez; ana sayfa listener'ı 50 hikâyenin TAM metnini her açılışta indiriyor.
- **Yapılacak (aşamalı):**
  1. `stories/{id}/chapters/{n}` alt koleksiyonu: `{ title, content, order, wordCount }`. Hikâye dokümanında yalnızca metadata (başlık, açıklama, kapak, sayaçlar, chapterTitles).
  2. Okuyucu yalnızca açık bölümü çeker (`getDoc(chapters/n)`), önceki/sonraki bölümü prefetch eder.
  3. Yazma akışı (`useComposer`, `chapterContent.ts`) bölüm dokümanlarına yazar; `§§` birleştirme kalkar.
  4. Migrasyon script'i: mevcut hikâyeleri `splitChapters` mantığıyla böl, alt koleksiyona yaz, eski `content` alanını koru (rollback için), yeni sürüm oturunca temizle.
  5. Kurallar: `chapters` yazma yalnızca hikâye yazarı (books/chapters'daki mevcut desen hazır).
  6. Ölü `books` koleksiyonu kodunu sil (`features/story/services/books.ts` kullanılmıyor — kafa karıştırıyor).
- **Not:** Bu en büyük kalem (~1 hafta). FAZ 1'i bekletme, paralel yürüt.
- **Kabul:** Ana sayfa açılışında indirilen veri hikâye başına ~1-2KB metadata; 500 bölümlük hikâye sorunsuz.

### 2.3 Bölüm-bazlı etkileşim 🟡 (Wattpad'in kalbi)
- Beğeniyi bölüm seviyesine indir: `stories/{id}/chapters/{n}/likes/{uid}` + bölümde `likesCount`. Hikâye toplamı = bölüm toplamlarının cache'i.
- Yorumlara `chapterIndex` alanı ekle; yorum ekranına bölüm filtresi.
- Yazar bildirimlerinde "X, 3. bölümünü beğendi" — yazar motivasyon döngüsü.
- **Kabul:** Okur bölüm sonunda oy verebiliyor; yazar hangi bölümün tuttuğunu görüyor.

### 2.4 Okuyucu deneyimi ayarları 🟡 (ucuz kazanım)
- Okuma teması: açık / sepya / koyu / siyah (OLED) — `useTheme`'den bağımsız, okuyucuya özel tercih (preferencesSlice'a ekle).
- Satır aralığı ve font seçimi (mevcut Spectral + 1-2 alternatif).
- Tercihleri `preferencesSlice` + AsyncStorage'da sakla.
- **Kabul:** Ayarlar paneli tema/font/boyut/aralık içeriyor; tercih kalıcı.

### 2.5 Arama ve keşif tavanını yükselt 🟡
- **Arama:** İstemci `includes()` araması yalnızca bellekteki ~50 hikâyede (`app/(tabs)/search.tsx:90`). Kısa vade: başlık için `title_lowercase` alanı + Firestore prefix sorgusu (`>=` / `<=` + ``), yazar için mevcut `searchUsers`. Orta vade (katalog >1000): Algolia/Typesense (VPS'e Typesense kurulabilir — bedava).
- **Keşif raf ömrü:** `discover.ts:22` 30 gün filtresini kaldır ya da "Yeni"nin yanına zaman filtresi olmayan "Tüm zamanlar" rafı ekle; tür sayfalarına `orderBy(viewsCount)` sıralaması ekle (composite index gerekir).
- **Sayfalama:** ana akışta `limit(50)` sonrası `startAfter` ile infinite scroll.
- **Kabul:** 51. hikâye keşfedilebilir; başlığı bilinen hikâye aramada çıkıyor.

### 2.6 Wattpad'den içerik taşıma akışı 🟡 (yazar mıknatısı)
- "Hikâyeni taşı" ekranı: çok bölümlü metni tek seferde yapıştır → `§§`/başlık sezgisiyle otomatik bölümlere ayır → önizle → yayınla. (Bölüm ayırma mantığı `chapterContent.ts`'te zaten var; UI akışı eksik.)
- Landing'deki "Wattpad'den taşınma rehberi" yazısıyla birleşir (1.4).
- **Kabul:** 30 bölümlük bir hikâye 5 dakikada taşınabiliyor.

### 2.7 Moderasyon süreci 🟡 (BTK riskine savunma)
- `reports` koleksiyonu yazılıyor ama okuyan yok. Minimum uygulanabilir süreç:
  - Basit admin görünümü (VPS'te küçük bir web sayfası ya da Firebase Console'da kayıtlı sorgu + haftalık takvim hatırlatıcısı).
  - Hikâye dokümanına `isHidden` alanı; kurallarda `isHidden == true` ise yazar dışında okunamaz; admin (custom claim) set edebilir.
  - 18+ içerik: `targetAudience == 'adult'` hikâyeler misafirlere hiç gösterilmesin (şu an sadece tercih filtresi var — misafir/reşit olmayan ayrımı yok).
- **Kabul:** Şikâyet edilen içerik 48 saat içinde incelenip gizlenebiliyor; 18+ içerik oturum açmamış kullanıcıya görünmüyor.

### 2.8 Küçük fonksiyonel buglar 🟢
- `deleteStory` (`storyApi.ts:142`): silmeyi `writeBatch` ile grupla (500'lük parçalar) — yarıda kesilme tutarsızlığını azalt.
- Eski format bölümleme tahmini (`app/story/[id].tsx:236`): 2.2 migrasyonu bunu kökten çözer; migrasyonda bölüm sınırlarını elle doğrula (katalog küçükken kolay).
- `messageThreads` update kuralı: `participants` alanının değiştirilemsini engelle (`onlyChanges` dışında `participants` diff kontrolü).
- Misafir görüntülenmeleri: 2.7'deki misafir politikasına göre karar ver — sayılacaksa anonim sayaç (sadece `increment`), sayılmayacaksa bilinçli olarak bırak.

---

## FAZ 3 — Altyapı sağlamlaştırma (FAZ 2 ile paralel/sonra)

### 3.1 Cloud Functions'a taşınacaklar
- **Push gönderimi:** `notifications` onCreate → token oku → Expo push. Sonra `userPushTokens` okuma kuralını kapat (0.3'ün kalıcı çözümü).
- **Hesap silme:** tek callable function tüm kullanıcı verisini siler (0.4'ün kalıcı çözümü).
- **Sayaç düzeltme cron'u:** haftada bir sayaçları alt koleksiyonlardan yeniden hesapla (drift onarımı).
- Not: Functions Blaze planı ister; bu ölçekte fiilen bedava.

### 3.2 Analitik ve retention ölçümü 🔴 (karar verisi)
- Firebase Analytics'te şu eventlerin attığını doğrula: `screen_view`, `story_read`, `story_publish`, `sign_up`, bölüm geçişi (yeni event: `chapter_read`, index'li).
- Funnel tanımla: kurulum → kayıt → ilk okuma → D1 dönüş → D7 dönüş.
- Haftalık bakılacak panel: D1/D7/D30 retention, kayıt dönüşümü (misafir→üye), okur/yazar oranı.
- **Kabul:** 4 hafta sonunda D1/D7 rakamları güvenilir şekilde okunabiliyor.

### 3.3 Crash/hata görünürlüğü
- Sentry zaten ekli (`@sentry/react-native`) — DSN'in prod build'de aktif olduğunu ve source map yüklendiğini doğrula. Release health (crash-free rate) panelini haftalık rutine ekle.

---

## FAZ 4 — Topluluk ve büyüme (mağaza yayını sonrası, sürekli)

### 4.1 İlk 20-30 yazar 🔴 (cold start'ın gerçek çözümü)
- Wattpad TR'de aktif, orta boy (1K-50K okunmalı) yazarları bul (VPN'le Wattpad'e bak; ayrıca eski Wattpad yazarlarının göç ettiği Twitter/X, TikTok, Tumblr TR toplulukları).
- Birebir ulaş; teklif: içerik taşıma yardımı (2.6) + "Editörün Seçimi"nde yer + kurucu yazar rozeti + gelecekteki gelir modelinde öncelik.
- Hedef: yayında **en az 100 hikâye / 20 aktif yazar** olmadan okur pazarlamasına para/emek harcama.

### 4.2 Niş seçimi
- Rakip analizinden (1.5) sonra karar ver: her şeye açık genel platform yerine 1-2 türde (TR'de en güçlüsü: romantizm + fantastik/fanfic) derinleş. Ana sayfa editoryal alanını bu nişe ayır.

### 4.3 Topluluk kanalı
- Discord/Telegram yazar topluluğu — moderasyonu ucuz, geri bildirim döngüsü hızlı. Challenges özelliği (zaten var) buradaki etkinliklerle beslenir.

---

## FAZ 5 — Monetizasyon (KAPILI — aşağıdaki eşikler geçilmeden BAŞLAMA)

**Eşik:** D7 retention ≥ %15 VE haftalık aktif kullanıcı 3 ay üst üste artıyor VE katalogda ≥ 300 hikâye.

Eşik geçilince sıra:
1. **Yazara bahşiş** (en düşük sürtünme, topluluk dostu) — IAP ile "çiçek gönder", %70 yazara (bakiye), %30 platforma. Bloom markasıyla doğal örtüşür.
2. **Destek aboneliği** (reklamsız zaten — "topluluğu destekle + rozet + erken erişim").
3. **Reklam** — yalnızca bölüm aralarında, native format; TR eCPM düşük olduğu için en son.
4. **Coin/bölüm kilidi** — ancak seri üreten sadık yazar kadrosu oluşursa (muhtemelen 2. yıl konusu).

---

## Sıralı özet (hangi gün neye başlanır)

| Hafta | İş |
|---|---|
| 1 | FAZ 0 tamamı (0.1-0.5) + Play Console hesabı aç, kapalı test başlat (1.2) |
| 2 | App Store + Play Store gönderimi (1.1, 1.2) + ASO metadata (1.3) + rakip analizi (1.5) |
| 3 | Landing + SEO yazıları (1.4) + okuma ilerlemesi Firestore'a (2.1) + okuyucu ayarları (2.4) |
| 4-5 | Bölüm-bazlı model migrasyonu (2.2) + arama/keşif (2.5) + moderasyon (2.7) |
| 6 | İçerik taşıma akışı (2.6) + bölüm etkileşimi (2.3) + yazar avı başlangıcı (4.1) |
| Sürekli | Analitik panelini haftalık oku (3.2); 3-6 ay sonra FAZ 5 eşiğini değerlendir |

## Yapılacaklar-DIŞI (bilinçli erteleme)
- Reklam SDK'sı eklemek (eşik var — FAZ 5)
- Web sürümü / react-native-web yayını
- Çoklu dil desteği (TR nişi avantaj, dağıtma)
- Sesli okuma / TTS, yapay zekâ yazma asistanı
- DM'i genişletmek (grup, medya) — mevcut hâli yeterli

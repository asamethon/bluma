# Bluma — hata çözümü devir dosyası

Güncelleme: **31 Ekim 2026**. Proje: `/Users/sametbalci/Desktop/fantasy/bluma_LATEST`.
Kaynak: kullanıcının 12 Ekim 2026 tarihli, 26 maddelik hata taraması.
Bu dosya kalan işleri ve önceki oturumun durumunu birlikte taşır.

## 31 Ekim 2026 — 26 maddenin tamamı kodda kapatıldı

`claude/quirky-bell-46oajz` dalında, madde gruplarına göre ayrı commit'ler:

| Commit | Maddeler |
| --- | --- |
| `e3745e1` | 22b-1, 25 — sayaç/yazarlık/`isPremium` kuralları; tek adımlı sayaç azaltma; profil kaydı yalnızca profil alanlarını yazar; kendi beğenilmiş yorumunu silme; yeniden yayında tekrar duyuru ve `storiesCount` kayması |
| `d8a9076` | Ek doğrulama — çıkışta kullanıcıya bağlı tüm dilimler sıfırlanır (`sessionEnded`) |
| `bfc0630` | 13–16, 19, 22b-2 — görev modeli: tekil anahtarlı sayım, haftalık/kalıcı ödül ayrımı, hafta sonu maratonu, XP kuralları; okuyucu "bitirdin" yalnızca tamamlanmış hikâyede |
| `981d54e` | 5–8 — +18, dil (kod olarak), etiketler, içerik uyarıları; okuyucuda yetişkin içerik kapısı |
| `912cf31` | 9–12 — okuma listeleri, "Tümü" bağlantıları, içe aktarma girişi; ölü `/conversation/create` kaldırıldı |
| `be5a151` | 17, 18, 20, 21 — e-posta anahtarı kaldırıldı, `@anma` bildirimi, okur niyeti, boş taslak silme |
| `2492acf` | 23, 24, 26 — lansman çevirileri (+ i18n eşitlik testi), sabit metinler, profilde konum/web sitesi |

Doğrulama: `yarn check` yeşil (tip + lint + knip kök/server/push-worker),
`yarn test` 209 test, `yarn test:rules` 36 kural testi (emülatör).

### Canlıya alma sırası

Bağımlılık iki yönlü: yeni uygulama `users/{uid}/private/account`'a yazar ve
eski kurallarda bu yol kapalıdır — kurallar geç kalırsa **yeni kullanıcı kayıt
olamaz**. Eski uygulama ise yeni kurallarda profil kaydı ve haftalık ödül
alırken reddedilir. Bu yüzden kurallar, yeni sürümün mağazada yayına çıktığı
anda dağıtılır (PRIVATE-PROFILES-MIGRATION.md ile aynı sıra):

1. Yeni native build (main'de Xcode 27 / ayrı Yaz sekmesi native değişikliği
   var; OTA yetmez). Mağazalara "elle yayınla" seçeneğiyle gönder.
2. Onay gelince, aynı oturumda: taşıma önizlemesi → `--apply` →
   `firebase deploy --only firestore:rules` → `--apply` tekrar → sürümü
   mağazalarda yayınla.
3. `server/push-worker` (anma bildirimi anma ayarına uyar): VPS'e dağıt.
   Bağımsızdır, istenen zaman yapılabilir.

### Bilinçli ürün kararları

- c4 "Yorumun öne çıkan seçilsin": uygulamada öyle bir özellik yok; görev
  "bir hikâyeye ilk yorumu sen bırak" oldu. r4 "yeni yazar" = takip etmediğin
  yazarın bölümünü bitirmek. w2 "5 farklı günde yayın", r3 "10 bölüm".
- E-posta bildirimi altyapısı yok; işlevsiz anahtar kaldırıldı.
- `/conversation/create` profil oluşturucusunun ölü kopyasıydı; silindi.
- `isPremium` ödeme sistemi değil, admin'in verdiği editoryal işaret.

### Kalan riskler (sunucu tarafı gerektirir)

- Sayaçlar istemciden atomik bump'la yazılır: kötü niyetli bir istemci
  tek adımlık artışı tekrarlayabilir. `push-worker/reconcile-counters.js`
  periyodik düzeltme için kullanılabilir; tam çözüm sunucu tarafı sayaç.
- Görev ilerlemesi istemciden yazılır: haftalık ödüller sahte ilerlemeyle
  haftada bir alınabilir (sınırsız XP kapalı). Tam çözüm sunucuda ödül.
- Çevrimdışı indirmeler cihaz düzeyindedir (hesaba değil); aynı cihazda
  hesap değişince görünür kalır — tarama kapsamında değildi.

Aşağıdaki bölümler tarihsel kayıttır.

## Yeni oturum için kısa durum

- 24 Ekim devamında yüksek öncelikli **4. maddenin yazar kontrolü** ele alındı:
  hikâye bilgi formuna Devam ediyor / Tamamlandı seçimi eklendi. Kod kontrolleri
  geçti; kullanıcı işlevsel kabul testinin geçtiğini doğruladı. Ardından durum
  seçenekleri ikonlu, lila seçim vurgulu alanlara dönüştürüldü; başlık 11 dile
  eklendi. Son görsel düzenlemenin kullanıcı kontrolü bekliyor. `w3` görev
  takibi hâlâ 13. madde kapsamındadır.
- 1, 2 ve 3. maddelerin kod düzeltmeleri ve önceki kullanıcı kabul testleri tamamlandı;
  canlıya geçiş gerektiren işler aşağıda ayrıca belirtiliyor.
- 22a yönetim alanı korumasının yerel testleri ve kullanıcı kabulü geçti.
- Son bildirilen **XP karışması şüphesi kapatıldı**: yerel kayıtta okurun yorum
  ilerlemesi 4/5, kitap yayımlama ilerlemesi 0/3; yazarınki sırasıyla 0/5 ve 1/3.
  İki hesapta da kazanılmış XP 0 ve alınmış ödül listesi boştu. Bunlar son okumanın
  değerleri; sonraki testlerde değişebilir. Veri sıfırlanmadı veya düzeltilmedi.
- Görev kartlarındaki +XP, kazanılabilecek sabit ödüldür; bütün hesaplarda görünür.
  Kullanıcıyla bu ayrım netleştirildi ve sıradaki işe geçme konusunda anlaşıldı.
- Beyaz ekran için kod düzeltildi; native `invalid-argument` hatasının kesin kökü
  tekrar üretilemedi. XP şüphesinin kapanması, bu ayrı hatanın cihazda kesin olarak
  çözüldüğünün kanıtı değildir. Yeniden bildirilirse ilgili bölümden devam et.
- **Sıradaki küçük parça: 22b — XP ve görev ödülü yetkileri. Henüz başlanmadı.**
  Önce mevcut kurallarda izinsiz XP/ilerleme/ödül yazımını emülatörde doğrula.
  Normal görev ilerlemesi ve ödül almayı koruyan çözümü uygula; yalnızca istemci
  yazımlarını yasaklayıp çalışan ödül akışını kırma. Gerekiyorsa güvenilir sunucu
  tarafı doğrulama tasarla; üretim dağıtımı bu görevin kapsamında değil.
- Ardından 22'nin sosyal/hikâye sayaç yetkileri, sonra 4–8 yazar kontrolleri.
  Her küçük parçada dur ve hesapları belirterek kullanıcı test senaryosu ver.

## Çalışma biçimi

- Hataları **tek tek, küçük parçalar halinde** çöz. Bir parçayı bitirince sonucu bildir ve dur.
- İlk olarak `AGENTS.md`, yeni koddan önce `docs/ARCHITECTURE.md` oku.
- Kullanıcının son tercihi: UI kabul testlerini kendisi yapacak; ajan ilgili kod kontrollerini çalıştıracak.
- Token/quota tüketimini düşük tut; kullanıcı istemedikçe UI otomasyonu veya alt ajan açma.
  UI otomasyonu tekrar istenirse kayıtlı Argent akışı, filtreli inceleme ve kısa rapor kullan.
- Geçen bütün testleri gerekçesiz tekrarlama. Her değişiklikten sonra `npx tsc --noEmit` zorunlu.
- **Canlıya deploy, veri taşıma veya yayınlama yapma.** Bu oturumda bunlar yapılmadı.

## Çalışma ağacı

Değişiklikler 24 Ekim 2026'da anlamlı commit'lere bölündü; push yapılmadı.
`yarn.lock` ayrı bir `chore` commit'inde tutulur; kullanıcı değişikliklerini koru.
Canlıya deploy ve veri taşıma bu çalışmada da yapılmadı.
Önce `git status --short` oku; toplu reset/discard/stash yapma.

## Kodda tamamlanan parçalar

### 24 Ekim — 4. madde: hikâyenin tamamlanma kontrolü

- Kök neden: `isCompleted` modelde ve okur tarafında kullanılıyordu; bilgi
  formunun yükleme/kaydetme modelinde ve arayüzünde alan yoktu.
- Yaz → hikâyenin üç nokta menüsü → Hikâye bilgilerini düzenle ekranına
  **Hikâyenin durumu** seçimi eklendi. Mevcut değer yüklenir, iki yönde de
  değiştirilebilir ve Kaydet ile yazılır. Vazgeçmek kaydı değiştirmez.
- Yeni form varsayılanı Devam ediyor; eski belgede alan yoksa da aynı seçim
  gösterilir. Tamamlanma seçimi hikâyeyi veya özel bölüm taslağını yayımlamaz.
- Değişen dosyalar: `features/story/components/studio/StoryInfoForm.tsx`,
  `features/story/hooks/useStoryInfoForm.ts`, `features/story/services/storyInfo.ts`.
- TypeScript 0 hata, bu üç dosyada ESLint temiz. Mevcut taslak/yayın paketinde
  7/7 test geçti; bunlar yeni durum seçiminin cihaz kabul testi değildir.
- Kullanıcı işlevsel kabul testinin geçtiğini doğruladı. Görsel geri bildirim
  üzerine seçeneklere ikon, seçili zemin/kenarlık ve onay işareti eklendi;
  `studio.storyStatusLabel` desteklenen 11 dilde tanımlandı. Ortak `ChoiceTile`
  ve feature içindeki `StoryStatusField` kullanılır; radyo seçimi erişilebilirliği
  eklendi. Bu görsel düzenlemede TypeScript ve ilgili ESLint temiz.
- Son görsel düzenlemenin kullanıcı kontrolü bekliyor; UI otomasyonu çalıştırılmadı. Firestore kuralı veya
  native kod değişmedi; deploy/commit/push yapılmadı.
- `w3` görevinin ilerlemesi bu parçaya dahil değil; 13. madde açık kalır.

Kullanıcı kabul testi (**bluma Yerel**, güncel Metro koduyla):
1. `yazar@bluma.test` ile Yaz → mevcut hikâyenin üç nokta menüsü → bilgi
   düzenleme ekranını aç. **Tamamlandı** seçip **Kaydet** de.
2. Aynı ekranı yeniden aç: Tamamlandı seçili kalmalı. Başlığı düzenleyip
   kaydettiğinde de durum korunmalı.
3. **Devam ediyor** seçip kaydet; yeniden açıldığında aynı seçim görünmeli.
4. Tamamlandı seçip **Vazgeç**: yeniden açıldığında Devam ediyor kalmalı.
5. Yayımlanmamış bir taslakta Tamamlandı seçip kaydet: stüdyoda Taslak
   kalmalı; `okur@bluma.test` hesabına geçince hikâye yayında görünmemeli.

### 23 Ekim — Hesap geçişinde beyaz ekran ve görev yükleme hatası

- Kullanıcı 22a testini geçtiğini bildirdi; okur hesabına geçerken beyaz ekran ve
  `challengeProgress.ts` kaynaklı `firestore/invalid-argument` gördü.
- Giriş rotası artık hazır oturumda genel `isLoading` bayrağını beklemiyor;
  oturum henüz bilinmiyorsa boş ekran yerine tema uyumlu yükleniyor göstergesi var.
- Aynı gün değişmeyen görev verisi sunucudan normal okunuyor; gereksiz native transaction
  açılmıyor. Takvim yenilemesi ve aksiyonlar transaction içinde yeniden okuma ile korunuyor.
- Native hatanın kesin kökü tekrar üretilemedi; salt okuyan REST transaction emülatörde geçti.
  Bu nedenle görev hatasının cihazda giderildiği henüz doğrulanmış sayılmamalı.
- İlgili 28 birim testi, tip kontrolü ve değişen kodun lint kontrolü geçti.
- Sonraki XP karışması şüphesi 24 Ekim'de kayıtlar incelenerek kapatıldı; yeni kod
  değişikliği yapılmadı. Beyaz ekran/native hata için ayrıca açık bir kabul sonucu
  alınmadı. UI testi ajan tarafından çalıştırılmadı.
- İlgili dosyalar: `app/index.tsx`, `features/auth/components/SessionEntry.tsx`,
  `features/auth/services/sessionEntry.ts`, `features/challenges/services/challengeRepository.ts`.
- Hedefli test komutu: `npx jest --runInBand --watchman=false __tests__/challengeProgress.test.ts __tests__/challenges.test.ts __tests__/sessionEntry.test.ts`.

### 1 — Açık profillerde özel bilgiler

- E-posta, Apple kimliği ve `signup*` bilgileri `users/{uid}/private/account` altına ayrıldı.
- Açık profil/cache/gömülü yazar nesneleri temizleniyor. Oturum e-postası Firebase Auth'tan geliyor.
- Özel belgeyi yalnızca sahibi okuyup yazabilir; açık profile özel alan yazılması engelleniyor.
- Profil yazımı izin hatası verdiğinde okunmuş profil kaybolmuyor; mevcut hesap kimliğiyle devam ediyor.
- Taşıma betiği varsayılan olarak önizleme yapar: `scripts/migratePrivateProfiles.cjs`.
- **Canlı veride açık kapanmış sayılmaz:** migration ve kural deploy'u henüz yapılmadı.
- Ayrıntı ve yayın sırası: [PRIVATE-PROFILES-MIGRATION.md](PRIVATE-PROFILES-MIGRATION.md).

### 2 — Taslakların hemen okura/bildirime gitmesi

- Özel taslak: `stories/{id}/draftChapters/{index}`; `_meta` yalnızca stüdyo özeti için.
- Autosave genel `/chapters` veya yayındaki bölüm sayısını değiştirmez.
- Açık **Yayınla** aksiyonu bölümleri ve üstveriyi atomik transaction ile yayınlar.
- Boş bölüm reddedilir; taslak korunur. Bildirim ancak başarılı yayından sonra gider.
- `lastNotifiedChapterCount`, metin düzeltmesi veya silip aynı bölüm sayısına dönmede tekrarı önler.
- Yazım kuyruğu, çıkışta kayıt ve yeniden açılışta bekleyen yazımı tamamlama eklendi.
- Ayrıntı: [CHAPTER-DRAFTS.md](CHAPTER-DRAFTS.md).

### Derleme, açılış ve Yaz sekmesi

- iOS deployment target/pod uyumu ve Xcode 27'nin UIScene yaşam döngüsü gereksinimi düzeltildi.
- Expo Router özel bileşene sarılmış `NativeTabs.Trigger` öğesini yok sayıyordu; doğrudan öğe oldu.
- **Kullanıcı tasarımı:** iOS 26+ dört sekmeli cam çubuk + sağda ayrı pembe çiçekli Yaz düğmesi.
- Eski iOS normal sekme kullanır; Android mevcut klasik tab bar'ı kullanır.
- `BlumaNativeTabs.tsx` sürüm koşulu ve `tab-write` test kimliğini içeriyor.
- Expo 56/RNS yeni tab katmanı yalnız `UITabBarItem` ürettiğinden ayrıklık kayboluyordu.
- Yeni native uyumluluk: `plugins/withIosDetachedWriteTab.js` + `plugins/ios/DetachedWriteTab.inc`.
- iOS 26+ `UITab`/`UISearchTab`; iOS 27'de ayrıca `prominentTabIdentifier` kullanır.
- RNS seçim/engelleme callback'leri korunur; modern API'nin boş `viewControllers` dizisi için uyarlama var.
- Yama prebuild'de tekrar uygulanır; `react-native-screens` **4.25.2** dışı sürümde bilinçli olarak durur.
- **Native değişikliktir; yalnız Metro/OTA yeterli olmaz, yeni native build gerekir.**
- Yerel iOS 27 build başarılı: 0 derleme hatası; kullanıcı ayrı Yaz düğmesini gördüğünü doğruladı.
- iOS 26.5 ve eski iOS cihaz doğrulaması henüz yapılmadı. Yeni native yama sonrası tüm tab geçişleri,
  misafir engellemesi, tema/rozet güncellemeleri ayrıca sınanabilir; bu oturumda tamamlandı diye sunma.

### 3 — Görev ilerlemesinin korunması (16 Ekim 2026)

- Görev yüklemesi profil ekranından çıkarılıp oturum başlangıcına bağlandı; uygulamaya
  dönüşte gün yenileniyor. Her aksiyon da sunucudaki gün/hafta durumunu kontrol ediyor.
- İlerleme haritasını boş store'dan bütünüyle yazmak kaldırıldı. Transaction güncel
  belgeyi okuyor; yalnız değişen alanlar atomik `increment()` ile yazılıyor.
- Ardışık yazımlar oturuma ait kuyrukta; bekleyen optimistic aksiyonlar Redux'ta.
  Başarısız aksiyon geri alınırken diğer bekleyen aksiyonlar korunuyor.
- Çıkış/hesap değişiminde görev verisi temizleniyor; eski oturumun geç gelen
  yükleme/yazma sonucu yeni hesaba uygulanmıyor.
- Ödül işlemi de güncel sunucu verisine dayanıyor; çift XP engelleniyor ve hatada
  optimistic XP/ödül durumu geri alınıyor.
- Doğrulama: görev servisleri/takvimi için **23 Jest testi başarılı**, TypeScript
  **0 hata**, ilgili ESLint temiz. Kullanıcı 22 Ekim devamında profilsiz yorum,
  ardışık yorum, yeniden açılış ve hesap değişimi kabul testlerinin geçtiğini doğruladı.
- Native kod veya Firestore kuralları değişmedi; deploy yapılmadı.
- **13–16 kapsam dışı:** görev tanımları/sayaç anlamları, haftalık ödül sıfırlama
  ve hafta sonu kartı hâlâ ayrı işler. Diğer slice'ların hesap izolasyonu da ayrı.

### 22a — Hikâyenin yönetim alanları (22 Ekim 2026)

- `isHidden` ve `isEditorsPick`, hikâye sahibinin genel güncelleme yetkisinden
  çıkarıldı. Yazar alanları ekleyemez, değiştiremez veya silemez; tam belge
  değiştirme ile alanın düşürülmesi de reddedilir.
- Yeni hikâyede bu alanlar yalnızca eksik veya `false` olabilir. Sonraki
  yönetim güncellemeleri Firebase Auth `admin` custom claim'i gerektirir;
  kullanıcı belgesindeki `admin`/`role` alanları yetki sağlamaz.
- Admin bu iki alanı boolean değerlerle güncelleyebilir; bu izin başka bir
  yazarın hikâye içeriğini düzenleme yetkisi vermez. Admin SDK mevcut güvenilir
  sunucu yoludur ve istemci kurallarına tabi değildir.
- Mevcut işaretli hikâyelerin içerik düzenleme, taslak, bölüm yayını ve okur
  sayaç işlemleri korunuyor. Uygulamanın ekran/servis kodu değiştirilmedi.
- Önce mevcut kuralla izinsiz yazının kabul edildiği gösterildi. Düzeltme
  sonrası **8 yeni yönetim + 6 mevcut taslak/yayın kural testi = 14/14 geçti**.
  TypeScript 0 hata; yeni test dosyasında ESLint temiz.
- Tekrar çalıştırma: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 GCLOUD_PROJECT=demo-bluma-local node --test scripts/tests/storyManagement.rules.test.cjs scripts/tests/chapterDraft.rules.test.cjs`.
- **Canlıya deploy yapılmadı.** Canlıda etkinleşmesi için planlı
  `firebase deploy --only firestore:rules` gerekir; bu komut önceki profil ve
  taslak kuralları dahil dosyanın tüm değişikliklerini yayımlar.
- **22. madde bütünüyle bitmedi:** XP/sayaç yetkileri sonraki ayrı parçadır.
- Kullanıcı aşağıdaki yerel kabul testlerinin geçtiğini 23 Ekim'de bildirdi.

Kullanıcı kabul testi (bluma Yerel):
1. `yazar@bluma.test` hesabıyla yeni bir hikâyeye başlık ve dolu bir bölüm yaz;
   çıkıp geri aç. Taslak korunmalı, izin hatası olmamalı.
2. Yayınla, başlık/metni düzenle ve yeniden yayınla. İşlemler başarılı olmalı.
3. `okur@bluma.test` hesabıyla bu hikâyeyi aç; yayındaki metni gör, beğen ve
   yorum gönder. Normal okur işlemleri çalışmalı.
4. İsteğe bağlı: yerel emülatör panelinde hikâyeyi `isEditorsPick: true` yap.
   Yazar hesabında başlığı düzenleyip kaydet; panelde işaret `true` kalmalı.
   Panel Admin erişimi kullandığından buradan alan değiştirmenin başarılı
   olması yetki açığı sayılmaz; yetkisiz istemci denemeleri kural testindedir.

## Kalan hatalar — özgün madde numaraları (31 Ekim'de kapatıldı, bkz. en üst)

Aşağıdaki 4–26 maddeler ilk taramadan devralındı; tümü bu oturumda yeniden denetlenmedi.
Her parçanın başında mevcut kodda doğrula. Özellik tercihleri belirsizse kaldırıldı diye varsayma.

| No | Öncelik / konu | Sorun ve beklenen düzeltme |
| --- | --- | --- |
| 4 | Yüksek — tamamlanma durumu | Yazar kontrolünün kullanıcı kabulü geçti. Ardından seçim UI'ı ve 11 dilde başlık yerelleştirmesi düzeltildi; görsel kontrol bekliyor. `w3` görev takibi ayrı 13. maddede açık. |
| 5 | Yüksek — yetişkin içerik | Eski `isMature` → `targetAudience: 'adult'` kontrolü kaybolmuş. Yeni hikâyelerde +18 seçilemediği için yetişkin içerik filtresi çalışmıyor. |
| 6 | Yüksek — etiketler | TagEditor kaldırılmış; yeni hikâyeler `tags: []`. Öneri ve arama eşleşmesi için yazma/düzenleme kontrolü geri gelmeli. |
| 7 | Yüksek — hikâye dili | Yazar dil seçemiyor; `createStory` arayüz dilini yazıyor. Eski `language: 'Türkçe'` gibi etiketler `tr` ile eşleşmiyor. Seçim ve eski veri normalizasyonu gerekli. |
| 8 | Yüksek — içerik uyarıları | `contentWarnings` artık ne yazılıyor ne okunuyor. Yazar kontrolü ve okura gösterim birlikte ele alınmalı. |
| 9 | Yüksek — okuma listeleri | Okuyucuda Listeye ekle var ama `/profile/lists` ekranına giriş yok. Listelere erişim tamamlanmalı. |
| 10 | Yüksek — beğenilenler | Kitaplık yalnız 10 beğeniyi gösteriyor; tümünü gör yok. `/profile/favorites` ve `/profile/saved` yetim. |
| 11 | Yüksek — içe aktarma | `/story/import` duruyor, giriş düğmesi kaldırılmış. Kasıtlı ürün kararı olup olmadığı belirsiz. 2. parçada içe aktarmanın servisleri taslak/yayın modeline uyarlandı; **ekrana giriş çözülmedi**. |
| 12 | Yüksek — yazar duyurusu | `/conversation/create` girişinin hiç bağlanmadığı raporlandı. Erişim ve kimlerin duyuru oluşturabildiği doğrulanmalı. |
| 13 | Orta — imkânsız görevler | w3, r4, c3, c4 `tracker: 'manual'`; ilerleten kod yok. Dört görev ve bağlı XP/rozetler tamamlanamıyor. |
| 14 | Orta — haftalık ödüller | `claimedChallenges` haftalık sıfırlanmıyor; haftalık görev ödülleri yalnız bir kez alınabiliyor. |
| 15 | Orta — görev anlamı/sayaç | w2 günlük yayın yerine streak; r2 hikâye bitirme yerine 3 bölüm; r3 10 hikâye yerine 10 bölüm; c1 farklı hikâyeler yerine aynı hikâyedeki yorumları sayıyor. İlk/tek bölüm sayılmıyor, tekrar okuma yeniden sayılıyor. |
| 16 | Orta — hafta sonu kartı | Sabit 2 gün; ilerleme tüm haftadan r1+c1; hedef/açıklama uyumsuz; ödül butonu yok. |
| 17 | Orta — e-posta ayarı | E-posta bildirimleri anahtarı kaydediliyor ama okunmuyor/uygulanmıyor. Gerçek tüketici veya doğru ürün davranışı gerekli. |
| 18 | Orta — mention | Alıcı/gösterim tarafı var, `mention` bildirimi üreten kod yok. |
| 19 | Orta — hikâye bitişi | Okuyucu son bölümü `isCompleted` kontrol etmeden Hikâyeyi bitirdin diye gösteriyor; devam eden hikâyede de çıkıyor. |
| 20 | Orta — yazar dürtmeleri | `syncWriterReminders` ve `HomeWriterNudge`, `intent: 'reader'` seçenlere de gidiyor. |
| 21 | Orta — boş taslaklar | Yeni hikâye her dokunuşta `useQuickDraft` ile Adsız hikâye oluşturuyor; vazgeçilince kalıyor ve hatırlatmaların hedefi olabiliyor. |
| 22 | Güvenlik — kısmen tamamlandı | `isHidden`/`isEditorsPick` koruması kodda ve emülatörde tamamlandı (22a); canlı deploy bekliyor. Kullanıcının XP/sayaç ve yazarın hikâye sayaç yetkileri sonraki parça. |
| 23 | Düşük — çeviriler | Lansman ekranındaki 20 anahtar yalnız tr/en'de; diğer 9 dil İngilizceye düşüyor. |
| 24 | Düşük — sabit metinler | `EditProfileScreen.tsx` ve `useMessageRemoval.ts` içinde sabit Türkçe metinler. Mevcut konumları yeniden bulup i18n'e taşı. |
| 25 | Düşük — premium | `isPremium` hep false; rozet ve %20 bonus etkisiz. Ürün kararı netleşmeden ödeme/premium sistemi icat etme. |
| 26 | Düşük — profil alanları | Web sitesi ve konum düzenlenebiliyor ama gösterilmiyor; görünürlük/ürün davranışı tamamlanmalı. |

### Ek doğrulama: hesaplar arası veri taşınması

Çıkış/hesap değişiminde story (userStories/saved/liked), readingList ve messaging
verilerinin diğer hesaba taşınıp taşınmadığı ayrı test edilmeli. Son `endSession`
auth/privacy yanında yeni `storyDraft` slice'ını da temizliyor; **tüm slice'lar
temizleniyor varsayma**. Challenge temizliği bu parçada çözüldü.

## 3. madde için kullanıcı kabul testi

Güncel JS kodunu yükleyen **bluma Yerel** sürümünü kullan; native build gerekmez.
Kurulum ve iki test hesabı: [LOCAL-TESTING.md](LOCAL-TESTING.md).
Aşağıdaki ilerleme karşılaştırmalarını aynı hafta içinde yap.

1. Okur hesabında Profil → seviye/XP satırı → görevler ekranından mevcut
   okuma/yorum/takip değerlerini, XP ve alınmış ödülleri not et. Yorum görevi
   5/5 olmamalı; doluysa diğer yerel hesabı kullan.
2. Çıkış yapıp aynı hesaba gir. **Profili açmadan** yayınlanmış bir hikâyeye
   yorum yap; sonra görevleri aç. Yorum ilerlemesi bir artmalı (en fazla 5),
   diğer görevler ve alınmış ödüller korunmalı.
3. Yeniden girişten hemen sonra profili açmadan art arda iki yorum gönder.
   İki yorum da başarıyla kaydolduysa görev ilerlemesi iki artmalı (en fazla 5).
   Uygulamayı yeniden açınca aynı değer kalmalı.
4. Yazar hesabına geç. Okurun XP/ödülleri görünmemeli; yazarın kendi değerleri
   gelmeli. Okura dönünce önceki ilerleme korunmalı.
5. Seri için isteğe bağlı panel testi: uygulama kapalıyken yerel Firestore'da
   test hesabının `lastActiveDate` alanını dünün `YYYY-AA-GG` değerine,
   `streak` alanını 3'e ayarla. Uygulamayı açıp yalnız ana sayfada bekle.
   Panelde tarih bugün, seri 4 olmalı; aynı gün yeniden açınca 4 kalmalı.

İlk yükleme/yazma gecikmesi, transaction tekrarı, hesap değişimi ve kayıt
hatasında geri alma ayrıca `__tests__/challengeProgress.test.ts` ile sınanır.
22a yönetim alanları parçası tamamlandı. Sonraki parça 22. maddedeki XP/sayaç
yetkileridir; ardından 4–8 arasındaki yazar kontrolleri küçük gruplar hâlinde ele alınır.

## Test durumu ve verimli devam

- Yerel kurulum: [LOCAL-TESTING.md](LOCAL-TESTING.md).
- Argent çalışma biçimi: [ARGENT-TESTING.md](ARGENT-TESTING.md).
- `yarn qa:ui run local-reader-check`: kayıtlı okur ekranı kontrolü.
- `yarn qa:ui run local-write-tab`: gerçek Yaz sekmesinden stüdyoya geçiş; eski native sürümde
  7 adım geçmişti, küçük ekran hareketi nedeniyle `WARN` vardı. Son native yamada henüz tekrar koşulmadı.
- Bu akışlar açık **yerel okur hesabı ve İngilizce arayüz** bekler; altı iş senaryosunun tüm otomasyonu değildir.
- Eski tam koşu: 23 paket/133 Jest testi ve 13 Firestore kural testi başarılıydı.
- Sonraki ek kontroller: raporlayıcı 4 test; ayrı Yaz native yaması 3 test başarılı.
- Son kod için TypeScript 0 hata ve ilgili ESLint temiz. Yeni native build 0 hata/5 uyarıyla tamamlandı.
- Uygulamada doğrulanan önceki altı senaryo: taslak izolasyonu, hızlı çıkışta kayıt, yayınlama,
  tekrarsız bölüm bildirimi, boş bölümün reddi, profilin kalıcılığı/e-postanın gizliliği.
- Gerçek sistem push'u, Google/Apple girişi, VPS görsel yükleme ve Android bu turda sınanmadı.

### Yerel ortam

- Ayrı uygulama: **bluma Yerel**, bundle `com.asamethon.bluma.local`; canlı uygulama oturumundan ayrı.
- Firebase yalnız `demo-bluma-local`: Auth 9099, Firestore 8787, panel 4000; Metro 8082.
- Sahte hesaplar: `okur@bluma.test`, `yazar@bluma.test`; ikisinin test parolası `BlumaTest123!`.
- Güncel Argent cihaz seçimi `.argent/session.local.json` içinde; bu dosya Git dışı.
- Kullanılan iOS 27 cihazı: `4E855405-3E8F-4E5F-8D4F-C8D5B59DBFE0`.
- Kurulu ama bu turda açılmayan iOS 26.5 iPhone Air: `289D84EE-67EC-4354-961E-7D683A92FF64`.
- Sunucular son bölümde yeniden başlatıldı ve sahte veriler tekrar seed edildi; önceki geçici
  test verilerinin/taslakların aynen durduğunu varsayma. Önceki test sonucu tarihsel kanıttır.
- Önceki oturumda Metro CI modundaydı; güncel süreç durumu yeniden kontrol edilmeli.
  JS değiştirirken 8082 Metro sürecini normal `yarn local:start` ile yeniden başlatmak gerekebilir.
- Başlatma: ayrı terminallerde `yarn local:emulators` ve `yarn local:start`.
  Kurulu **bluma Yerel** uygulamasını aç; yalnız JS değişiklikleri için Reload yeterli.
  `yarn local:seed` mevcut test verisini değiştirebilir; devam etmek için gelişigüzel çalıştırma.
- Eski `.argent/flows/local-challenge-comments.yaml` tamamlanmamış denemedir;
  güvenilir kabul akışı sayma. `scripts/qa/challengeFixture.cjs` ve eski fixture
  yedeğini körlemesine çalıştırma/geri yükleme; son kullanıcı ilerlemesini ezebilir.
- Native build betiği kurulumdan sonra `ios/` yapılandırmasını normal uygulamaya geri aldı.
- Son build logu: `.argent/results/detached-write-build.log`; native iOS 27 görüntüsü:
  `/private/tmp/bluma-detached-ios27.png`. Git dışı/geçici kayıtların her zaman kalacağını varsayma.

## Canlıya çıkış hâlâ ayrı iş

1. Profil migration/istemci uyumu ve Firestore kuralları birlikte planlanmalı; doğrudan deploy etme.
2. `firebase deploy --only firestore:rules` dosyadaki **bütün** değişiklikleri dağıtır; yalnız taslak kuralı değildir.
3. Taslak yazma ve özel hesap belgeleri yeni kuralları gerektirir; eski canlı kurallarla izin hatası beklenebilir.
4. Yaz düğmesinin native düzeltmesi için yeni binary gerekir; canlıya bu oturumda gönderilmedi.

## Yeni oturuma verilebilecek istek

> `docs/HATA-COZUM-DEVIR.md` dosyasını ve proje talimatlarını oku. XP karışması
> şüphesi kapatıldı; sıradaki iş 22b: XP ve görev ödülü yetkileri. Önce mevcut
> kodda açığı doğrula, normal ilerleme/ödül kazanmayı bozmadan bu küçük parçayı çöz.
> Sosyal/hikâye sayaçlarını ayrı parçaya bırak. Token/quota tüketimini düşük tut;
> UI testlerini ben yapacağım. Gerekli kod kontrollerini çalıştır, sonra hangi
> hesapla nasıl test edeceğimi adım adım yazıp dur. Mevcut değişiklikleri ve test
> verilerini koru; canlıya deploy, toplu veri sıfırlama veya migration yapma.

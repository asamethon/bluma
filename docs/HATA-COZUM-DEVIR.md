# Bluma — hata çözümü devir dosyası

Güncelleme: **31 Ekim 2026**. Proje: `/Users/sametbalci/Desktop/fantasy/bluma_LATEST`.
Kaynak: kullanıcının 12 Ekim 2026 tarihli, 26 maddelik hata taraması.
Bu dosya kalan işleri ve önceki oturumların durumunu birlikte taşır.

**Sayaç: 26 maddenin 25'i kapandı.** Kodda açık kalan tek madde, 22'nin XP yazma
yetkisidir (22b). Madde 25 ürün kararıyla kapatıldı: bu uygulamada abonelik veya
premium satışı olmayacak. Madde madde durum aşağıdaki tabloda.

## Yeni oturum için kısa durum

- **26 maddeden 25'i kodda kapandı** (24–26 Ekim commit'leri). Kodda açık kalan
  tek iş 22b: `firestore.rules:127` hâlâ sahibin `xp` alanını doğrudan yazmasına
  izin veriyor. Diğer bütün maddeler 31 Ekim'de kodda tek tek doğrulandı.
- **Madde 25 (premium) ürün kararıyla kapatıldı:** bu uygulamada abonelik veya
  premium satışı olmayacak. `isPremium` sabit `false` kalır; bu bir hata değil ve
  ödeme/premium sistemi icat edilmeyecek. Geriye kalan rozet (`StoryCover.tsx`) ve
  popülerlik bonusu (`discover/popularity.ts`) ölü koddur — istenirse ayrı bir
  temizlik işi, hata listesinin parçası değil.
- **Commit edilmemiş 7 dosya var:** `features/challenges/definitions.ts`,
  `features/challenges/services/challengeState.ts`,
  `features/profile/components/challenges/ChallengesScreen.tsx`,
  `features/story/hooks/useReaderChapters.ts`,
  `features/story/hooks/useWriterActivation.ts`,
  `features/story/services/commentMutations.ts`, `i18n/locales/tr.json`.
  13, 15, 16 ve 20. maddelerin son rötuşları bunların içinde; kullanıcı
  değişikliklerini koru, toplu reset/discard/stash yapma.
- **"Kodda tamam" ≠ "canlıda tamam":** 1, 2 ve 22a için profil migration'ı ve
  `firebase deploy --only firestore:rules` yapılmadı; ayrı Yaz sekmesinin native
  yaması için yeni binary gönderilmedi. Ayrıntı: "Canlıya çıkış hâlâ ayrı iş".
- Kullanıcı kontrolü bekleyen iki nokta: 4. maddenin son görsel düzenlemesi ve
  23 Ekim'de görülen beyaz ekran / native `firestore/invalid-argument` hatası.
  İkincisinin kesin kökü tekrar üretilemedi; cihazda çözüldüğü varsayılmamalı.
- XP karışması şüphesi 24 Ekim'de kapatıldı: görev kartlarındaki +XP kazanılabilecek
  sabit ödüldür, bütün hesaplarda görünür. Veri sıfırlanmadı veya düzeltilmedi.

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

### 24–26 Ekim — 5–21, 23, 24, 26. maddeler ve 22'nin sayaç parçası

Hepsi commit'li (aksi belirtilmedikçe) ve 31 Ekim'de kodda doğrulandı.

- **5 — yetişkin içerik:** `targetAudience` seçimi hikâye bilgi formuna geri geldi
  (`c9b8b68`, `StoryInfoForm.tsx`).
- **6 — etiketler:** en fazla 5 etiketli giriş yazma/düzenleme ve gösterimde
  (`c0077c8`).
- **7 — hikâye dili:** yazar dil seçiyor; 11 uygulama dili + "Diğer"
  (`240315e`, `e28e908`, `1da549b`).
- **8 — içerik uyarıları:** yazar seçimi (`5b8b10b`) ve okur/önizleme gösterimi
  (`a275bf7`) birlikte.
- **9 — okuma listeleri:** Ayarlar → `/profile/lists` girişi (`5a8ab22`).
- **10 — beğenilenler/kaydedilenler:** Kitaplıkta "tümünü gör" →
  `/profile/favorites`, `/profile/saved` (`4249c46`).
- **11 — içe aktarma:** stüdyo hub başlığından `/story/import` girişi
  (`8e39626`, `useWriteStudio.importStory`).
- **12 — yazar duyurusu:** kendi profilden `/conversation/create` erişimi ve
  yazma yetkisine göre akış (`3b5a54c`, `0d6f56f`).
- **13 — imkânsız görevler:** `tracker: 'manual'` tamamen kalktı; c4 artık
  `commentFeatured` ile ilerliyor (`5421f83` + commit'siz rötuş).
- **14 — haftalık ödüller:** `claimedChallenges` hafta başında sıfırlanıyor
  (`e414d8c`, `challengeState.ts:39`).
- **15 — görev anlamı/sayaç:** sayaçlar kendi içeriğini saymayacak şekilde
  düzeltildi (`ee3eb5e` + commit'siz yorum sayacı rötuşu).
- **16 — hafta sonu kartı:** dinamik gün sayısı, hedef 5→3, ödül alınabilir
  (`1c52f81`; `endsToday`/`endsInDays` çevirileri commit'siz).
- **17 — e-posta ayarı:** uygulanmayan anahtar kaldırıldı (`65c4f79`). Gerçek
  e-posta bildirimi istenirse yeni bir iştir, bu madde değil.
- **18 — mention:** yorumlarda @bahsetme bildirimi üretiliyor; yönlendirme,
  vurgulama ve öneri listesi ardından düzeltildi (`13a0810` ve takip commit'leri).
- **19 — hikâye bitişi:** son bölüm kartı yalnız `isCompleted === true` ise
  "Hikâyeyi bitirdin" gösteriyor (`ReaderChapterTail.tsx:75`).
- **20 — yazar dürtmeleri:** `writerReminders.ts:14` ve `useWriterActivation`
  `intent === 'reader'` seçenleri dışlıyor (hook değişikliği commit'siz).
- **21 — boş taslaklar:** aynı boş taslak yeniden kullanılıyor, her dokunuşta
  "Adsız hikâye" açılmıyor (`75ad270`).
- **22 — sosyal/hikâye sayaçları:** sayaç artışı yalnızca gerçek beğeni/takip
  dokümanıyla kabul ediliyor (`445cb1c`, `97ed61f`). XP parçası (22b) açık.
- **23 — çeviriler:** lansman anahtarları 11 dilde (`a82f5dc`).
- **24 — sabit metinler:** i18n'e taşındı (`27c688a`).
- **26 — profil alanları:** web sitesi ve konum profil başlığında gösteriliyor,
  adres doğrulaması eklendi (`1906876`, `95d111c`).

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

### 22b — XP ve görev ödülü yetkileri (24 Ekim 2026)

- Açık olan `xp`'nin sahibince yazılması tekrar doğrulandı. Karmaşık kurallar
  Firestore Rules derlemesi sınırını aştığı için mevcut kural dosyasına
  güvenli ve minimal bir düzeltme eklenemedi; değişiklikler geri alındı.
- Mevcut kurallarla `local-reader`'daki eksik `w2` durumu gün yenilemesi
  yazımını engelleyebiliyor; bu daha çok veri durumu. XP açığı ayrı bir parçada
  ele alınabilir. Canlı deploy / migration yapılmadı.

## Madde durumları — özgün numaralar

12 Ekim taramasının 26 maddesi. "✅ kod" = kodda doğrulandı; canlı deploy/binary
gerektirenler ayrıca işaretli. Yeni bir parçaya başlarken durumu kodda tekrar
doğrula; özellik tercihleri belirsizse kaldırıldı diye varsayma.

| No | Konu | Durum |
| --- | --- | --- |
| 1 | Açık profillerde özel bilgiler | ✅ kod — migration + kural deploy bekliyor |
| 2 | Taslakların hemen okura/bildirime gitmesi | ✅ kod — kural deploy bekliyor |
| 3 | Görev ilerlemesinin korunması | ✅ kullanıcı kabulü geçti |
| 4 | Hikâyenin tamamlanma durumu | ✅ — son görsel düzenleme kullanıcı kontrolünde |
| 5 | Yetişkin içerik (+18) | ✅ |
| 6 | Etiketler | ✅ |
| 7 | Hikâye dili | ✅ |
| 8 | İçerik uyarıları | ✅ |
| 9 | Okuma listeleri | ✅ |
| 10 | Beğenilenler/kaydedilenler | ✅ |
| 11 | İçe aktarma girişi | ✅ |
| 12 | Yazar duyurusu | ✅ |
| 13 | İmkânsız görevler | ✅ (commit'siz rötuş) |
| 14 | Haftalık ödül sıfırlaması | ✅ |
| 15 | Görev anlamı/sayaçlar | ✅ (commit'siz rötuş) |
| 16 | Hafta sonu kartı | ✅ (commit'siz rötuş) |
| 17 | E-posta bildirim ayarı | ✅ — anahtar kaldırılarak çözüldü |
| 18 | Mention bildirimi | ✅ |
| 19 | Hikâye bitişi | ✅ |
| 20 | Yazar dürtmeleri | ✅ (commit'siz rötuş) |
| 21 | Boş taslaklar | ✅ |
| 22 | Güvenlik: yönetim alanları / sayaçlar / XP | ⚠️ **kısmi** — 22a ve sayaçlar bitti, **22b XP açık** |
| 23 | Lansman çevirileri | ✅ |
| 24 | Sabit metinler | ✅ |
| 25 | Premium | ⛔ **ürün kararıyla kapatıldı** — abonelik/premium olmayacak, `isPremium` sabit `false` |
| 26 | Profil alanları (web sitesi, konum) | ✅ |

### Açık tek iş: 22b — XP yazma yetkisi

`firestore.rules:127` kullanıcı belgesinde sahibe tam güncelleme veriyor, yani
istemci `xp`'yi istediği değere yazabilir. 24 Ekim'de denenen kapsamlı kural
düzeltmesi Firestore Rules derleme sınırını aştığı için geri alındı; bu parça
farklı bir yaklaşım gerektiriyor (ör. XP'yi ayrı belgeye/işleve taşımak).
Ayrıntı: yukarıdaki "22b — XP ve görev ödülü yetkileri" bölümü.

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
22a yönetim alanları, sosyal/hikâye sayaç yetkileri ve 4–8 arasındaki yazar
kontrolleri tamamlandı; kalan tek güvenlik parçası 22b XP yazma yetkisidir.

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

> `docs/HATA-COZUM-DEVIR.md` dosyasını ve proje talimatlarını oku. 26 maddelik
> hata listesinin 25'i kapandı; kodda açık tek iş 22b — kullanıcı belgesindeki
> `xp` alanının istemciden yazılabilmesi. Madde 25'e (premium) dokunma: abonelik
> olmayacak, kapandı. Önce açığı emülatörde doğrula, sonra Rules derleme sınırını
> aşmayan küçük bir çözüm kur; normal görev/ödül akışlarını bozma. Token/quota
> tüketimini düşük tut; UI testlerini ben yapacağım. Gerekli kod kontrollerini
> çalıştır (`npx tsc --noEmit` zorunlu), sonra hangi hesapla nasıl test edeceğimi
> adım adım yazıp dur. Commit edilmemiş 7 dosyayı ve test verilerini koru; canlıya
> deploy, toplu veri sıfırlama veya migration yapma.

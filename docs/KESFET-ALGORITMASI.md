# Bluma: Ana Sayfa ve Keşfet Algoritması (v1)

10 Ekim 2026. Durum: **Faz 0 tamamlandı (10 Ekim 2026)**, Faz 1 bekliyor.
Kapsam: ana sayfa (`features/home`), Ara/Keşfet (`features/search`), yeni `features/discovery` ve VPS'te yeni `server/discovery` servisi.

---

## 0. Karar (özet)

1. **Makine öğrenmesi yok, şimdilik.** 453 kayıtlı kullanıcı ve birkaç yüz hikâyeyle işbirlikçi filtreleme anlamlı sinyal üretmez. Doğru araç: şeffaf, kural tabanlı, zaman ağırlıklı bir sıralama + editör katmanı + ölçüm.
2. **Sıralama sunucuda hesaplanır, kişiselleştirme cihazda yapılır.** VPS'te (push-worker ile aynı desende) bir `discovery` servisi tüm kataloğu görür, bölümleri hesaplar ve tek bir `discovery/home` dokümanına yazar. Uygulama ana sayfayı 1 okumayla kurar, "Senin için" sıralamasını kendi sinyalleriyle cihazda yapar.
3. **Her bölüm tek bir soruya cevap verir ve bir hikâye ana sayfada yalnızca bir kez görünür.** 15 raftan 7 bölüme iniyoruz.
4. **Yeni yazara garantili vitrin.** Kalite kapısını geçen her yeni hikâye ilk 72 saat "Yeni ve Yükselen"de yer alır. Asıl darboğaz içerik arzı; yazar ilk hikâyesinde okur görmezse ikinciyi yazmaz.
5. **Ölçmeden ayar yok.** Algoritmayla aynı sürümde bölüm bazlı gösterim/tıklama olayları ve okumanın hangi bölümden geldiği (`src`) çıkar.

---

## 1. Bugünkü durum (kod incelemesi)

Canlı veriye erişilemedi; bulgular koddan ve 6-7 Eylül Goldie simülatör çekimlerinden. Ana sayfa ve arama kodu o tarihten beri değişmemiş.

| # | Bulgu | Kanıt | Etki |
|---|---|---|---|
| 1 | Ana sayfadaki her şey **son yayınlanan 50 hikâyeden** türetiliyor | `storyFeedListeners.ts:22` `limit(50)`, `HomeIdleContent.tsx` tüm raflar `props.stories` | 51. hikâye yayınlandığında en eski hikâye, ne kadar popüler olursa olsun ana sayfadan tamamen düşer |
| 2 | Arama **son 100 hikâyede** istemci tarafı substring | `searchCatalog.ts:30` | 101. hikâyeden sonra eski hikâyeler aranamaz |
| 3 | "Editörün Seçimi" editör seçimi değil | `useEditorsPicks.ts`: popülerlik skoru 1. sıra | Elle seçim yok; `isEditorsPick` alanı tipte var ama hiç yazılmıyor |
| 4 | "Bu Hafta Öne Çıkanlar" haftalık değil | `HomeIdleContent.tsx:72` aynı listenin 2-12'si | Editörün Seçimi ile aynı kaynaktan |
| 5 | Aynı hikâye üst üste rafta | Android çekimi: Brooklyn önce "Okumaya Devam Et", hemen altında "Editörün Seçimi" | Küçük katalog 15 rafta aynı kapakları döndürüyor |
| 6 | Takip akışı **iki kez ölü** | `listeners.ts:23` her açılışta `loadFollowingStories` çalışıyor ama sonucu kullanan ekran yok. Üstelik sorgu `following`'i `orderBy('createdAt')` ile çekiyor, takip dokümanları ise `followedAt` ile yazılıyor (`followRelations.ts:62`, `review.ts:30`); Firestore sıralama alanı olmayan dokümanları döndürmez, liste her zaman boş | Topluluğun en güçlü sinyali hiç kullanılmıyor |
| 7 | Topluluk ana sayfada görünmez | `conversations` yalnızca yazarın profilinde listeleniyor | Etkileşimin olduğu yer vitrinde yok |
| 8 | Popülerlik skoru tüm zamanların sayaçları | `popularity.ts`: yorum×5, beğeni×3, görüntülenme×0,1 | Yazarın kendi etkileşimi ayıklanmıyor, yeni hikâyenin görünme garantisi yok, zengin daha zengin |
| 9 | Ölçüm yok | Analytics: yalnızca screen_view, sign_up, story_read, chapter_read, story_publish | Hangi bölümün okuma getirdiği bilinmiyor, ayar yapılamaz |
| 10 | Çevrimiçi yenileme boş | `useHomeFeed.ts:63` yalnızca çevrimdışıyken iş yapıyor | Aşağı çekmek hiçbir şey yapmıyor |
| 11 | "Trend aramalar" trend değil | `useSearch.ts:81` tüm zamanların en çok beğeni+yorum alan başlıkları | Altında da son 100 hikâyenin sırasız listesi var |
| 12 | Kullanıcı araması harfe duyarlı | `userSearch.ts` prefix sorgusu | "sule" yazan "Şule"yi bulamaz |
| 13 | İsim çakışması | Alt sekme "Keşfet" = ana sayfa; "Ara" ekranının başlığı da "Keşfet" | Kafa karıştırıyor |
| 14 | Okuma maliyeti | Her ana sayfa açılışı: 50 (listener) + 100 (discover) + takip sorguları; arama +100 | Spark plandaysanız DAU büyüdükçe günlük 50K kotasına yaklaşır |

---

## 2. İlkeler

- **Ölçek gerçekçiliği.** Sinyal seyrek: birkaç düzine haftalık aktif okur. Formül sade ve açıklanabilir olmalı; her ağırlık bir cümleyle savunulabilmeli.
- **Okurun geri dönme sebebi** (yeni bölüm, takip ettiğin yazar, topluluk) popülerlikten önce gelir. W1 tutma %8-9; ana sayfanın işi ikinci oturumu yaratmak.
- **Yazarın görünürlüğü** bir ürün özelliğidir. Keşif payı ve 72 saatlik vitrin pazarlık konusu değil.
- **Kendi kendine etkileşim sayılmaz.** Yazarın kendi okuması, beğenisi, yorumu sıralamaya girmez. Bir kullanıcı bir hikâyeye her sinyal türünden en fazla bir kez katkı verir.
- **Bozulmaya dayanıklılık.** VPS düşerse ya da doküman 24 saatten eskiyse uygulama bugünkü istemci mantığına geri düşer.

---

## 3. Mimari

```
Firestore ──listener──► server/discovery (VPS, systemd, Admin SDK)
   stories, likes, comments, views,           │  bellekte 14 günlük olay penceresi
   savedStories, readingProgress, followers   │  10 dk'da bir, değişiklik varsa:
                                              ▼
                               discovery/home    (kartlar + bölüm ID listeleri)
                               discovery/search  (arama indeksi: hikâye + yazar)
                                              │  1'er okuma
                                              ▼
                     features/discovery (uygulama)
                     filtre (engel, gizli, +18) → kişiselleştirme → dedupe → ekran
```

**Neden VPS servisi?** Blaze gerektirmez, `push-worker` zaten Admin SDK, systemd, `bluma-cron.sh` uyarı e-postası ve `watchAdded` listener desenine sahip. Yeni servis `server/discovery` dizininde, ayrı `bluma-discovery.service` olarak çalışır (sıralama hatası push bildirimlerini düşürmesin diye aynı süreçte değil).

**Servisin işleyişi**
- Açılışta: yayındaki tüm hikâyeler + son 14 günün olayları (collection group sorguları, `createdAt/updatedAt >= şimdi-14g`). Sonrasında listener'lar yalnızca değişiklikleri okur.
- 10 dakikada bir, bir şey değiştiyse `discovery/home` ve `discovery/search` yazılır (en fazla ~150 yazma/gün).
- Her gece 04:00 süreç pencereyi kaydırmak için listener'ları yeniden kurar.
- `likes` collection group'u hikâye, bölüm, yorum ve gönderi beğenilerini birlikte döndürür: yol derinliğine bakılarak yalnızca `stories/{id}/likes/{uid}` alınır. Aynısı `comments` için.

**`discovery/home` şeması**
```ts
{
  version: 1,                 // algo_version, analytics'e gider
  generatedAt: Timestamp,
  cards: Record<storyId, {
    title, coverImage, category, tags, language,
    authorId, authorName, authorUsername, authorAvatar, authorPrivate,
    chaptersCount, readingTime, isCompleted, targetAudience, isHidden,
    likesCount, commentsCount, viewsCount,
    publishedAt, lastChapterAt,
    hot, quality, readers7d     // istemcinin kişiselleştirmede kullandığı skorlar
  }>,
  sections: {
    editorsPicks: string[],   // elle, en fazla 5
    trending: string[],       // 30 aday, istemci filtreden sonra 10 gösterir
    rising: string[],         // 30 aday
    updated: string[],        // son 14 gün yeni bölüm
    allTime: string[],
    completed: string[],
    shortReads: string[],     // ≤ 10 dk
    byCategory: Record<category, string[]>,
    writers: { userId, name, username, avatar, followers, stories, readers14d }[],
    tags: { tag, count }[],
  }
}
```
Boyut: ~300 kart × ~500 bayt ≈ 150 KB, 1 MB sınırının çok altında. Katalog ~1500 hikâyeyi geçince kartlar parçalara bölünür.

Gizli hesap yazarlarının hikâyeleri, gizlenmiş (`isHidden`) hikâyeler ve kalite kapısını geçemeyenler genel bölümlere hiç girmez. +18 ve engel filtreleri bugünkü istemci zincirinde kalır (`filterBlocked → filterPrivateContent → filterHidden → filterMature`), kartlar bu fonksiyonların beklediği alanları taşır.

---

## 4. Sinyaller ve formüller (sunucu)

### 4.1 Olaylar

| Olay | Kaynak | Ağırlık | Not |
|---|---|---|---|
| Okur | `stories/{id}/views/{uid}.updatedAt` | 1 | Tekil okur |
| Devam eden okur | `users/{uid}/readingProgress/{storyId}.chapterIndex ≥ 1` | 2 | Bölüm 2'ye geçti: seri kurguda en güçlü kalite sinyali |
| Kaydetme | `users/{uid}/savedStories/{storyId}.createdAt` | 2 | |
| Beğeni | `stories/{id}/likes/{uid}.createdAt` | 3 | |
| Yorum | `stories/{id}/comments` (yazar hariç, kullanıcı başına 1) | 4 | |

Yazarın kendi olayları ve silinmiş kullanıcılar hariç. Her kullanıcı her türden hikâye başına en fazla 1 kez sayılır.

### 4.2 Gündem (`trending`, "Bu hafta gündemde")
```
hot(s) = Σ ağırlık(e) × 0,5 ^ (yaş_saat(e) / 72)        // yarı ömür 3 gün
uygunluk: son 7 günde yazar dışında ≥ 3 farklı kullanıcı
çeşitlilik: ilk 10'da aynı yazardan en fazla 2
```

### 4.3 Yeni ve yükselen (`rising`)
```
aday: publishedAt ≤ 21 gün ve kalite kapısını geçti
oran(s) = (3·beğeni + 4·yorum + 2·kaydetme + 2·devam_eden + 1) / (okur + 4)   // düzeltilmiş etkileşim oranı
sıra: oran'a göre; AMA ilk 72 saatteki hikâyeler 1, 3, 5... pozisyonlara zorunlu yerleşir
```
Kalite kapısı: kapak var, başlık "Adsız Hikâye" değil, açıklama ≥ 30 karakter, toplam kelime ≥ 500 (`chapterWordCounts`).

### 4.4 Diğer bölümler
- **`updated` (Yeni bölüm gelenler):** `lastChapterAt` son 14 gün, `chaptersCount ≥ 2`, `lastChapterAt` azalan.
- **`editorsPicks`:** `isEditorsPick == true`, `editorsPickAt` azalan, en fazla 5. Öne çıkan kart her gün sırayla döner (`günNo % n`). Hiç seçim yoksa bölüm gizlenir; popülerlikle doldurulmaz.
- **`allTime` (Tüm zamanların favorileri):** `kalite = (beğeni + 1,5·yorum + m·10) / (okur + 10)` (m = katalog ortalaması, Bayes düzeltmesi) × `log10(1 + okur)`.
- **`completed`, `shortReads`, `byCategory`:** `quality` ile sıralı.
- **`writers` (Takip edebileceğin yazarlar):** en az 1 yayında hikâye, keşfedilebilir hesap; skor = 14 günlük tekil okur + 2 × 14 günlük yeni takipçi + son 7 günde yayın yaptıysa 5.
- **`tags`:** en az 2 hikâyede geçen etiketler, Türkçe katlanmış (bkz. 7.2), ilk 20.

---

## 5. Kişiselleştirme (cihazda, saf fonksiyon, test edilir)

`features/discovery/services/personalize.ts`, bugünkü `recommendations.ts`'in yerini alır.

**Zevk profili:** beğeni 3, okuma ilerlemesi 2, kaydetme 2, onboarding ilgi alanı 1,5. Kategori, etiket ve yazar ağırlıkları bugünkü gibi; **takip edilen yazar +3** eklenir.

**Skor**
```
skor(s) = yakınlık(s) × (0,6 + 0,4 × kalite_norm(s)) + 0,5 × hot_norm(s) + dil_çarpanı
```
- Hariç: kendi hikâyesi, Okumaya Devam Et'tekiler, beğenip bitirdikleri.
- **Çeşitlilik:** aynı yazar art arda gelmez, aynı kategori en fazla 2 kez art arda.
- **Keşif payı:** her 5 slottan 1'i profile uymayan bir `rising` hikâyesi (filtre balonunu kırar, yeni yazara okur getirir).
- **Günlük tazelik:** skorları birbirine %10 yakın olanlar `userId + tarih` tohumuyla karıştırılır. Ana sayfa her gün aynı görünmez ama gün içinde de oynamaz.
- **Soğuk başlangıç:** sinyal yoksa ilgi alanlarına göre filtrelenmiş `trending`; ilgi alanı da yoksa düz `trending`.
- **Neden etiketi:** her öneri kısa bir gerekçe döner ve kartın altında görünür: "Romantik okuduğun için", "Takip ettiğin @minasko'dan", "Bu hafta 23 okur". Algoritmayı profesyonel gösteren şey bu şeffaflıktır.

---

## 6. Ana sayfa: yeni yapı

**Dedupe kuralı:** bölümler yukarıdan aşağı doldurulur; bir hikâye üstteki bir bölümde göründüyse alttakilerden çıkarılır. Okumaya Devam Et'teki hikâyeler hiçbir başka bölümde görünmez.

| Sıra | Bölüm | Kaynak | Görsel form | Koşul |
|---|---|---|---|---|
| 1 | Okumaya devam et | `continueReading` | Kompakt satır + ilerleme çubuğu + **"Yeni bölüm"** rozeti (`lastChapterAt > progress.updatedAt`) | Varsa, en fazla 3 |
| 2 | Takip ettiklerinden | `followingStories` (Faz 0'da düzeltilmiş sorgu) | Raf | Takip varsa ve son 14 günde içerik varsa |
| 3 | Senin için | `personalize()` | Raf + neden etiketi | Her zaman (soğuk başlangıçta gündem) |
| 4 | Bu hafta gündemde | `trending` | **Numaralı liste 1-10** (büyük rakam + StoryRow) | ≥ 3 hikâye |
| 5 | Editörün seçimi | `editorsPicks` | `StoryCardFeature` | Elle seçim varsa |
| 6 | Yeni ve yükselen | `rising` | Raf, "Yeni" mührü | Her zaman |
| 7 | Yeni bölüm gelenler | `updated` | Raf | ≥ 3 hikâye |
| (Faz 3) | Topluluktan | gönderiler | Gönderi kartı | Bkz. Faz 3 |

Kaldırılanlar: 9 tür rafı ve "En çok okunanlar" Keşfet'e taşınır; "Bu Hafta Öne Çıkanlar" gerçek gündemle değişir; ana sayfadaki tür çipleri kalkar (Keşfet'te zaten var).

Diğer:
- **Başlık bloğu küçülür:** "İyi akşamlar, Samet" tek satır `title` boyutunda. Selamlama + dev `display` isim, tür çipleriyle birlikte ilk ekranın üst ~%20'sini kaplıyor ve hiçbir hikâye göstermiyor; o alan Okumaya Devam Et'e gider.
- Her bölüm başlığında "Tümü" → bölüm sayfası (dokümandaki ID listesiyle FlashList).
- Aşağı çekince `discovery/home` sunucudan yeniden okunur.
- Sonda "Keşfetmeye devam et" → Keşfet sekmesi.
- Sekme adları: ana sayfa **"Ana Sayfa"**, Ara sekmesi **"Keşfet"**. (Goldie akışları "Keşfet" metnini bekliyor, birlikte güncellenmeli.)

---

## 7. Keşfet (Ara): yeni yapı ve arama

### 7.1 Boşta (yazı yokken)
1. Arama çubuğu
2. **Türler:** 2 sütun kutucuk, her biri o türün en iyi kapağı + hikâye sayısı
3. **Popüler etiketler:** gerçek etiket sayımları (`sections.tags`)
4. **Takip edebileceğin yazarlar:** avatar, ad, "3 hikâye · 120 okur", `FollowButton`; kendisi, takip ettikleri ve engelledikleri hariç
5. **Tamamlanmış hikâyeler**, **Kısa okumalar (≤ 10 dk)**, **Tüm zamanların favorileri**

Son 100 hikâyenin sırasız listesi ve sahte "trend" çipleri kalkar. Son aramalar yalnızca arama kutusu odaktayken görünür.

### 7.2 Arama
- `discovery/search` dokümanı: yayındaki **tüm** hikâyeler (`id, başlık, yazar adı, kullanıcı adı, etiketler, açıklamanın ilk 140 karakteri, popülerlik`) + keşfedilebilir yazarlar (`id, ad, kullanıcı adı, avatar, takipçi, hikâye sayısı`). **E-posta ve diğer kimlik alanları kesinlikle girmez.**
- Oturum başına 1 okuma, sonra cihazda anında arama.
- **Türkçe katlama:** `toLocaleLowerCase('tr-TR')` sonra ı→i, ğ→g, ü→u, ş→s, ö→o, ç→c, â→a, î→i, û→u; noktalama ve emoji atılır. "hikaye" = "hikâye", "sule" = "Şule".
- Eşleşme: sorgudaki her kelime, bir alandaki bir kelimenin başıyla eşleşmeli. Alan ağırlıkları: başlık 5, yazar/kullanıcı adı 4, etiket 3, açıklama 1; × `log10(2 + popülerlik)`.
- Sonuç ekranı: `SegmentedControl` ile **Hikâyeler | Yazarlar | Etiketler**.
- Tür sayfası: sıralama seçici **Popüler | Yeni | Güncel | Tamamlanan**.
- ~1500 hikâye veya ~300 KB'ı geçince VPS'te Typesense'e geçilir. Bugün gerekmez.

---

## 8. Ölçüm (algoritmayla aynı sürümde çıkar)

| Olay | Parametreler | Ne zaman |
|---|---|---|
| `feed_impression` | `section, section_position, item_count, algo_version` | Bölümün en az yarısı 0,6 sn ekranda kaldığında, uygulama oturumu başına bölüm başına 1 kez (`useSectionImpressions`). Kart düzeyi gösterim bu ölçekte istatistiksel anlam taşımaz; gerekirse Faz 1'de eklenir |
| `feed_click` | `section, position, story_id, algo_version` | Karta dokunuş |
| `story_read`, `chapter_read` | mevcut + **`src`**, `algo_version` | Rota parametresi yerine `feedAttribution.ts`: karta dokunulunca kaynak hikâye kimliğiyle not edilir, 30 dk içinde açılan okuyucu onu alır; yoksa `direct` |
| `search_query` | `query_length, result_count, tab` | Gönderimde |
| `search_click` | `result_type, position` | Sonuca dokunuş |
| `follow` | `src` (`search`, `profile`, `reader`) | Başarılı takip (gizli hesaba istek sayılmaz) |

`section`, `src`, `algo_version` Firebase'de özel boyut olarak kaydedilir.

**Haftalık bakılacaklar**
- Bölüm bazlı tıklama oranı (`feed_click / feed_impression`)
- Okumaların kaynağa göre dağılımı (`story_read.src`)
- Aktif kullanıcı başına bölüm okuma (25 Ağu: aylık 1,84)
- W1 tutma (bugün %8-9)
- Yazar tarafı: yeni hikâyelerin ilk 72 saatte topladığı tekil okur

**Hedefler (tahmin değil, hedef):** W1 %12; yeni hikâyelerin %80'i ilk 72 saatte en az 5 tekil okur. 4 hafta sonra veriye göre ağırlıklar ayarlanır; her ayar `algo_version`'ı artırır.

---

## 9. Firestore değişiklikleri

**Yeni alanlar (`stories`)**
- `publishedAt`: yayına geçtiği her yolda bir kez (`storyMutations.ts`: `createStory` içinde `isPublished` ise, `updateStory` içinde `becamePublished` dalı). Bugünkü `createdAt` taslak açılış zamanı; hızlı taslakla açılıp 3 hafta sonra yayınlanan hikâye "eski" sayılıyor.
- `lastChapterAt`: bölüm sayısı arttığında (aynı dosya, `chapterAdded` dalı).
- `editorsPickAt`: editör seçiminde.
- Geriye dönük doldurma: servis ilk açılışta `publishedAt ??= createdAt`, `lastChapterAt ??= updatedAt`.

**Kurallar (`firestore.rules`)**
```
match /discovery/{docId} {
  allow read: if true;
  allow write: if false;      // yalnızca Admin SDK
}
// stories update: admin dalı
|| (isAdmin() && onlyChanges(['isHidden', 'isEditorsPick', 'editorsPickAt']))
```
Ardından `firebase deploy --only firestore:rules`.

**İndeksler (`firestore.indexes.json` → `fieldOverrides`, `COLLECTION_GROUP`)**
`likes.createdAt`, `comments.createdAt`, `views.updatedAt`, `savedStories.createdAt`, `readingProgress.updatedAt`, `followers.followedAt` (takip dokümanlarında alan adı `createdAt` değil `followedAt`).

**Editör seçimi arayüzü:** admin claim'i olan hesapta hikâye ⋯ menüsüne "Editör seçkisine ekle/çıkar". Faz 1'de Firebase konsolundan elle de yapılabilir.

---

## 10. Fazlar

### Faz 0: Ölçüm ve hızlı düzeltmeler (1-2 gün, sunucu gerektirmez)
- [x] Bölüm 8'deki olaylar + `src` parametresi (`features/discovery`: `constants.ts` içinde `ALGO_VERSION = 0`, `feedEvents.ts`, `feedAttribution.ts`, `useSectionImpressions.ts`)
- [x] Ana sayfa genelinde dedupe; Okumaya Devam Et'tekiler başka bölümde görünmez (`features/home/services/homeSections.ts`, saf fonksiyon + `__tests__/homeSections.test.ts`). Okumaya Devam Et ana sayfada en fazla 3; eşiğin altında kalan raf (3'ten az) gösterilmez
- [x] "Takip ettiklerinden" rafı: `followingFeed.ts` takip listesini sıralama alanı vermeden okur (eski `orderBy('createdAt')` her zaman boş dönüyordu), global `isLoading`'i açmaz; raf ana sayfada 2. sırada
- [x] "Editörün Seçimi" yalnızca `isEditorsPick` doluysa görünür, birden fazla seçim varsa her gün sıradakine döner; "Bu Hafta Öne Çıkanlar" kalktı, yerine dürüst adıyla "Şu An Popüler" (aynı zaman ağırlıklı popülerlik skoru, Faz 1'de gerçek gündemle değişecek)
- [x] Aşağı çekince gerçekten yenileme (takip rafı, Okumaya Devam Et, beğeni durumu)
- [x] Ara ekranındaki sahte trend çipleri kalktı; klavyeden arama `search_query`, sonuca dokunuş `search_click` olarak ölçülüyor
- [x] Sekme adları: ana sayfa sekmesi "Ana Sayfa" (`tabs.home`, 11 dil), Ara ekranı başlığı "Keşfet" olarak kaldı. Goldie akışları güncellendi
- [x] Ek (Faz 1'den öne çekildi): ana sayfadaki 9 tür rafı kaldırıldı. Dedupe sonrası yalnızca artıkları göstereceklerdi; tür gezintisi üstteki çiplerle ve Ara ekranıyla devam ediyor
- **Faz 0 ana sayfa sırası:** Okumaya Devam Et → Takip Ettiklerinden → Editörün Seçimi → Sana Özel → Şu An Popüler → Yeni Geldi → En Çok Okunanlar
- **Kabul:** analytics DebugView'da `feed_impression`/`feed_click` bölüm adıyla görünüyor. (Cihazda doğrulanacak: `-FIRDebugEnabled` ile çalıştırıp ana sayfayı kaydır, bir karta dokun.)
- **Konsolda yapılacak:** Firebase Analytics → Custom definitions → event-scoped boyut olarak `section`, `src`, `algo_version`, `result_type` kaydet. Kaydedilmeden önce gelen olaylarda bu parametreler raporlarda görünmez.

### Faz 1: Sıralama servisi ve yeni ana sayfa (5-7 gün)
- [ ] `server/discovery`: listener'lar, formüller (bölüm 4), `discovery/home` yazımı, README + systemd birimi, `bluma-cron.sh` uyarısına bağlı sağlık kontrolü
- [ ] `publishedAt`, `lastChapterAt`, kurallar, indeksler, geriye dönük doldurma
- [ ] `features/discovery`: servis, `useDiscovery`, `personalize.ts` (+ jest testleri), bölüm bileşenleri
- [ ] Ana sayfa bölüm 6'daki yapıya geçer; eski 50'lik listener ve `loadDiscoverStories` ana sayfadan kalkar; `nextReads` aday havuzu `discovery/home` kartlarına geçer
- [ ] Doküman yoksa veya 24 saatten eskiyse eski istemci mantığına geri düşüş
- [ ] **Yeni bölüm bildirimi okurlara da gider:** bugün `announceStoryToFollowers` yalnızca yazarın takipçilerine gidiyor; hikâyeyi okuyan ama yazarı takip etmeyen okur haber almıyor. Servis `readingProgress` üzerinden okurları bulup bildirim yazar. (Geri getirmenin en güçlü kaldıracı.)
- **Kabul:** 51. hikâye yayınlandığında en eski popüler hikâye hâlâ gündemde/tüm zamanlarda görünebiliyor; ana sayfanın hikâye vitrini tek doküman okumasıyla kuruluyor (Okumaya Devam Et ve takip sorguları hariç).

### Faz 2: Keşfet ve arama (4-5 gün)
- [ ] `discovery/search` + Türkçe katlamalı yerel arama (+ testler)
- [ ] Boşta Keşfet yapısı (bölüm 7.1), Hikâyeler/Yazarlar/Etiketler sekmeleri, tür sayfası sıralama seçici
- [ ] Eski `getPublishedSearchStories` (100'lük) ve prefix kullanıcı araması kalkar
- **Kabul:** en eski yayındaki hikâye başlığıyla ve "sule" gibi aksansız yazımla bulunuyor.

### Faz 3: Topluluk (Faz 1'den 3-4 hafta sonra, veriye bakarak)
- [ ] "Topluluktan" bölümü: takip edilenlerin gönderileri (`conversations`, `authorId in` parçalı sorgu) + sunucunun hesapladığı popüler gönderiler
- [ ] Onboarding'e "3 yazar takip et" adımı (`sections.writers`), takip grafiğini başlatır
- [ ] "Takip ettiklerin beğendi" sosyal kanıtı (sunucu, aktif kullanıcı başına küçük doküman)
- [ ] Faz 0 verisine göre ağırlık ayarı, `algo_version: 2`

---

## 11. Bilerek yapmadıklarımız

- **İşbirlikçi filtreleme / gömme (embedding) tabanlı öneri:** ~5K aylık aktif kullanıcıya ve birkaç haftalık gösterim/tıklama verisine kadar beklenir.
- **DM verisi sıralamaya girmez.** Özel yazışma, içerik sıralamasının sinyali olmaz.
- **Typesense/Algolia:** katalog ~1500 hikâyeyi geçene kadar gerekmez.
- **Dil başına ayrı bölümler:** trafiğin ~%99'u Türkiye. TR dışı içerik anlamlı hacme ulaşınca servis `sections` setini dil başına üretir; bugün istemcideki dil çarpanı yeterli.

---

## 12. Yan bulgu: e-posta adresleri herkese açık (acil, algoritmadan bağımsız)

`firestore.rules` → `match /users/{userId}` → `allow read: if true`. Aynı dokümana `providerSession.ts` kayıt ve her girişte `email` (Apple girişinde ayrıca `appleUserId`) yazıyor. Sonuç: uygulamanın içinde gömülü (dolayısıyla herkese açık) API anahtarına sahip herkes `users` koleksiyonunu listeleyip tüm kullanıcıların e-postasını toplayabilir. KVKK/GDPR açısından risk.

Çözüm: e-posta ve sağlayıcı kimliklerini `users/{uid}/private/account` gibi yalnızca sahibine açık bir alt dokümana taşı, ana dokümandan sil (Admin SDK ile tek seferlik geçiş), `ProviderIdentity` yazımını ayır. `discovery/search` indeksine bu alanlar zaten girmeyecek.

---

## 13. Açık sorular

- Yayındaki hikâye sayısı bugün kaç? 50'yi geçtiyse bulgu 1 şu an yaşanıyor, 100'ü geçtiyse bulgu 2 de.
- Firebase planı Spark mı Blaze mı? Okuma bütçesi hesabı buna bağlı.
- Samet'in hesabında `admin` claim'i var mı (editör seçimi arayüzü için)?

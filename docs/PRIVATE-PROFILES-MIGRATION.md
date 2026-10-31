# Özel hesap alanlarının taşınması — hata taraması 1. madde

`users/{uid}` herkese açık profil olarak kalır. E-posta, Apple kullanıcı kimliği
ve `signup*` kayıt bağlamı `users/{uid}/private/account` içinde tutulur; bu
belgeyi yalnızca hesap sahibi okuyabilir/yazabilir. Oturumun e-posta kaynağı
Firebase Auth'tur. Profil güncellemeleri özel alanları tekrar yayımlamaz.
Firestore okuma izni belge düzeyinde olduğu için özel alanlar ayrı belgede
tutulur ([Firebase rehberi](https://firebase.google.com/docs/firestore/security/rules-fields#allowing_read_access_only_for_specific_fields)).

## Canlıya alma sırası — aşamalı açılış anahtarıyla

Kısıtlar `firestore.rules` içindeki `legacyClientsRetired()` anahtarına bağlı.
**false** iken yeni kuralların eklediği her şey (özel hesap belgesi, taslak
bölümler, yönetim alanı koruması) yürürlükte; eski mağaza sürümünü kıran
kısıtlar (özel alan yasağı, XP sınırı, sayaç kanıtı) beklemede. Bu sayede
hiçbir aşamada kullanıcı kırılmaz.

**Neden böyle:** yeni sürüm profil kaydını tek `writeBatch` ile yapıyor
(`features/auth/services/profileRepository.ts`) — açık profil + özel hesap
belgesi birlikte. Canlıdaki eski kurallarda `private/{docId}` kuralı hiç yok,
yani batch tümden reddedilir ve **3.0.1 profil kaydedemez**. Öte yandan tüm
kısıtlarla dağıtım yapılırsa mağazadaki eski binary ile gelen yeni kullanıcılar
kayıt olamaz. İkisini ayıran şey bu anahtar.

### 1. aşama — şimdi (anahtar false)

1. `firebase deploy --only firestore:rules` (anahtar false halde).
   Hem eski hem yeni sürüm tam çalışır; yeni sürümün ihtiyaç duyduğu
   `private/{docId}` ve `draftChapters` kuralları açılır.
2. 3.0.1'i mağazaya gönderin.

### 2. aşama — sürüm yayıldıktan sonra

3. Önizleme (veri değiştirmez):
   `node scripts/migratePrivateProfiles.cjs --project=bluma-dc10e`
4. Taşımayı uygulayın: aynı komut `--apply` ile.
5. `legacyClientsRetired()` → `return true;` yapıp
   `firebase deploy --only firestore:rules` çalıştırın.
6. Betiği tekrar `--apply` ile çalıştırın; aradaki sürede eski istemcilerin
   yeniden yazmış olabileceği alanları temizler. Son salt okunur taramada her
   iki koleksiyonda da `0 değişecek` beklenir.

2. aşamadan sonra eski sürümde kalan kullanıcılar profil kaydı, parola
değiştirme ve sayaç artışında reddedilir; bu yüzden 2. aşamayı sürüm yayılmadan
başlatmayın. Kural testleri anahtarın iki durumunda da yeşildir (33/33).

**Yan fayda:** 3.0.1 profil kaydederken özel alanları açık profilden `deleteField()`
ile siliyor. Yani güncelleyen her kullanıcı kendi belgesini kendiliğinden
temizliyor; 4. adımdaki taşıma yalnızca geride kalanlar için gerekiyor.

## Ölçek — 1 Kasım 2026 önizlemesi

Canlı projede (`bluma-dc10e`) salt okunur koşu:
**835 kullanıcı belgesinin 835'i, 56 duyurunun 56'sı taşınacak.** Yani açık
profillerin tamamında hâlâ e-posta/kayıt bağlamı duruyor ve bunlar `users`
koleksiyonu herkese okunabilir olduğu için dışarıya açık. Önizleme yaklaşık
6-7 dakika sürdü (belge başına bir okuma transaction'ı); `--apply` koşusu için
benzer, muhtemelen biraz daha uzun bir pencere ayır.

Not: kurallar taşımadan önce dağıtılırsa bu 835 kullanıcının **hiçbiri**
profilini veya görev ilerlemesini yazamaz — kural yazma sonrası belgenin
tamamına baktığı için, belgede e-posta durduğu sürece `displayName` gibi masum
bir güncelleme bile reddedilir (emülatörde doğrulandı).

### Kapsam denetimi (salt okunur, 1 Kasım 2026)

Özel alanların başka yerde gömülü kalıp kalmadığı canlıda tarandı:

| Koleksiyon | Sonuç |
| --- | --- |
| `users` | 835/835 belgede özel alan → betik taşıyor |
| `conversations` | 56/56 belgede `author.email` + `author.signup*` → betik temizliyor |
| `stories` | 216 tarandı, **0** — gömülü yazar nesnesinde özel alan yok |
| `conversationComments` | 400 tarandı, 0 |
| `notifications` | 400 tarandı, 0 |
| `reports` | 6 tarandı, 0 |
| `stories/*/comments` | 40 hikâye örneği, 0 |

Yani betiğin kapsamı (users + conversations) mevcut veri için **tamdır**;
başka koleksiyonda temizlenecek özel alan kalmıyor.

### Neden taşımayı tek başına uygulamıyoruz

Taşıma veri açısından güvenli (belge başına transaction, önce kopyala sonra sil,
tekrar çalıştırılabilir; e-posta ayrıca Firebase Auth'ta da var). Ama kurallar
dağıtılmadan tek başına uygulanırsa:

- **Eski sürümde Google/Apple girişi** her oturum açılışında `identity` nesnesini
  (e-posta dahil) açık profile geri yazıyor → alan geri geliyor.
- **Eski sürümde parola değiştirme** `auth.user?.email` okuyor ve bu değer eski
  sürümde Firestore belgesinden geliyor; alan silinince akış kırılabilir.
- Kullanıcı adı olmayan hesaplarda profil etiketi e-postaya düşüyordu; boş kalır.

Açığı kalıcı kapatan şey kural dağıtımı, o da yeni sürümün kullanıcıda olmasını
gerektiriyor. Bu yüzden taşıma + deploy + sürüm aynı pencerede yapılır.

Betik kullanıcıları ve duyuruları 200'er belge halinde tarar. Her kullanıcının
özel verisini tek transaction ile kopyalar ve açık profilden siler. Hedefte
zaten bulunan güncel özel alanların üzerine yazmaz. Eski duyuruların `author`
nesnesine gömülen özel alanları da temizler. Tekrar çalıştırılabilir; loglara
e-posta, cihaz bilgisi veya kullanıcı kimliği yazmaz. Başarısızlıkta sıfırdan
tekrar çalıştırın; tamamlanan belgeler atlanır.

Kurallar dağıtılmadan ve taşıma tamamlanmadan canlı verideki açık kapanmış
sayılmaz. Eski istemcilerin özel alan yazması kurallarla reddedilir; uygulama
sürümüyle birlikte planlanmalıdır.

## Kontrol

- `npx tsc --noEmit`
- `npx jest --runInBand __tests__/profilePrivacy.test.ts`
- Firestore emülatöründe `node --test scripts/tests/profilePrivacy.rules.test.cjs`
  (demo proje ve `FIRESTORE_EMULATOR_HOST` gerekir; gerçek projede çalışmaz).

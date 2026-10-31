# Özel hesap alanlarının taşınması — hata taraması 1. madde

`users/{uid}` herkese açık profil olarak kalır. E-posta, Apple kullanıcı kimliği
ve `signup*` kayıt bağlamı `users/{uid}/private/account` içinde tutulur; bu
belgeyi yalnızca hesap sahibi okuyabilir/yazabilir. Oturumun e-posta kaynağı
Firebase Auth'tur. Profil güncellemeleri özel alanları tekrar yayımlamaz.
Firestore okuma izni belge düzeyinde olduğu için özel alanlar ayrı belgede
tutulur ([Firebase rehberi](https://firebase.google.com/docs/firestore/security/rules-fields#allowing_read_access_only_for_specific_fields)).

## Canlıya alma sırası

1. Yeni uygulama sürümünü dağıtıma hazırlayın. Aşağıdaki işlemleri ve sürüm
   dağıtımını aynı geçişte planlayın: yeni sürüm özel belge kuralını gerektirir;
   eski sürümlerin açık profile özel alan yazması yeni kurallarla reddedilir.
2. Firebase Admin SDK için yetkili Application Default Credentials bulunan
   ortamda önizleme çalıştırın (veri değiştirmez):
   `node scripts/migratePrivateProfiles.cjs --project=bluma-dc10e`
3. Taşımayı uygulayın:
   `node scripts/migratePrivateProfiles.cjs --project=bluma-dc10e --apply`
4. Hemen ardından `firebase deploy --only firestore:rules` çalıştırın.
5. Betiği tekrar `--apply` ile çalıştırın; aradaki sürede eski istemcilerin
   yeniden yazmış olabileceği alanları temizler. Son salt okunur taramada her
   iki koleksiyonda da `0 değişecek` sonucu beklenir.
6. Hazırlanan uygulama sürümünü dağıtın. Eski sürümlerde profil kaydı ve
   duyuru paylaşımı yeni sürüme geçene kadar reddedilebilir.

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

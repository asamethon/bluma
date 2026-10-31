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
